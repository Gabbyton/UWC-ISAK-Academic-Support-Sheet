tutorNames = [];
tutorsList = [];
signupTableRaw = [];
var schedBlocks = [];
days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

var prefQueue = [];
var regQueue = [];
var warningPile = [];
var assignPile = [];

var tutorLimit = 2;

function assignTutor() {
  var tutorHoursTallySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Tutor Hours Tally");
  var signUpSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sign Up");
  var schedBlockSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Schedules");
  
  getSchedBlocks(schedBlockSheet);
  getTutorsList(tutorHoursTallySheet);
  getSignupSheet(signUpSheet);
  // sort preferred queue according to date of last edit
  prefQueue.sort(function(a,b){
    if(a[6]>b[6])
      return 1;
    else if(a[6]<b[6])
      return -1;
    else
      return 0;
  });
  var transferQueue = assignPrefQueue(schedBlockSheet);
  regQueue = regQueue.concat(transferQueue);
  // sort regular queue according to date of last edit
  regQueue.sort(function(a,b){
    if(a[6]>b[6])
      return 1;
    else if(a[6]<b[6])
      return -1;
    else
      return 0;
  });
  assignRegQueue(schedBlockSheet);
  writeProgramOutput(signUpSheet);
}

// get schedule blocks
function getSchedBlocks( schedBlockSheet ) {
  var schedBlockRangeValues = schedBlockSheet.getRange(4, 2,14).getValues();
  schedBlockRangeValues.forEach( function( item, index ) {
    schedBlocks.push( item[0] );
  });
}

// retrieve the emails and names of the tutors
function getTutorsList(tutorHoursTallySheet) {
  var tutorHoursRangeValues = tutorHoursTallySheet.getRange(2,1,tutorHoursTallySheet.getLastRow()-1,tutorHoursTallySheet.getLastColumn()).getValues();
  tutorHoursRangeValues.forEach(function(item,index){
    tutorNames.push(item[0]);
  });
  tutorHoursRangeValues.forEach(function(item,index){
    var name = item[0];
    var email = item[1];
    var score = item[6];
    var hours = 0;
    var tutorInfo = [name,email,score,hours];
    tutorsList.push(tutorInfo);
  });
}
// create an array of name, email, propensity score, and a variable for holding assigned hours

// retrieve entire sign up data range
function getSignupSheet(signUpSheet) {
  var signupTableRaw = signUpSheet.getRange(16,1,signUpSheet.getLastRow()-16+1,7).getValues();
  signupTableRaw.forEach(function(entry,entryIdx){
    if( entry[0] != "" && entry[1] != "" && entry[2] != "" && entry[3] != "" ) {
      var email = entry[0];
      var subject = entry[1];
      var day = days.indexOf(entry[2]);
      var time = schedBlocks.indexOf(entry[3]);
      var dateModified = entry[6];
      var rowNumber = entryIdx;
      var preferred = entry[4];
      var tableRow = [email,subject,time,day,rowNumber,preferred,dateModified];
      // assign each entry to either preferred or regular pool
      if( preferred != "" )
        prefQueue.push(tableRow);
      else
        regQueue.push(tableRow);
    }
    else if(entry[0] != "") {
      warningPile.push([entryIdx,"Input insufficient"]);
    }
  });
}

// double queue system:

// iterate through preferred:
function assignPrefQueue(schedBlockSheet) {
  var schedTableRangeValues = schedBlockSheet.getRange("C4:I17").getValues();
  var toTransfer = [];
  prefQueue.forEach(function(entry,entryIdx){
    var targetSchedContent = schedTableRangeValues[entry[2]][entry[3]];
    Logger.log(entry);
    var availableTutors = parseTableCell(targetSchedContent);
    if(availableTutors != null) {
      var prefAvailable = false;
      try {
        availableTutors.forEach(function(offering,offeringIndex){
          if(entry[5]==offering[0]) {
            var currTutorHours = tutorsList[tutorNames.indexOf(offering[0])][3] + 1;
            if(currTutorHours <= tutorLimit) {
              assignPile.push([entry,offering[0]]);
              tutorsList[tutorNames.indexOf(offering[0])][3] ++;
              prefAvailable = true;
            }
            if(prefAvailable)
              throw BreakException;
          }
        });
        if(!prefAvailable) {
          toTransfer.push(entry);
        }
      }
      catch(e) {
        // error handling here
      }
    }
    else {
      warningPile.push([entry[4],"No mentors available at that time"]);
    }
  });
  return toTransfer;
}

// iterate through regular pool:
function assignRegQueue(schedBlockSheet) {
  var schedTableRangeValues = schedBlockSheet.getRange("C4:I17").getValues();
  regQueue.forEach(function(entry,entryIdx){
    var targetSchedContent = schedTableRangeValues[entry[2]][entry[3]];
    var availableTutors = parseTableCell(targetSchedContent);
    if(availableTutors != null) {
      var candidateNames = [];
      // TODO
      // break when hopeless
      // break when a candidate is assigned
      var subjectAvailable = false;
      availableTutors.forEach(function(tutorEntry,tutorIndex){
        tutorEntry[1].forEach(function(subject,subjectIndex){
          if(subject.indexOf(entry[1])>-1) {
            candidateNames.push(tutorEntry[0]);
            subjectAvailable = true;
          }
        });
      });
      if(!subjectAvailable) {
        warningPile.push([entry[4],"Subject not available at that time"]);
      }
      else {
        // TODO:
        // filter list to contain the same grade level
        // if empty, use the next highest grade level, and so on
        
        var candidates = [];
        candidateNames.forEach(function(candidateName,candidateNameIndex){
          var pushCandidate = tutorsList[tutorNames.indexOf(candidateName)];
          var pushCandidateHours = pushCandidate[3] + 1;
          if(pushCandidateHours <= tutorLimit){
            candidates.push(pushCandidate);
          }
        });
        if(candidates.length==0){
          warningPile.push([entry[4],"Available mentor/s will exceed limit."]);
        }
        else{
          candidates.sort(function(a,b){
            if(a[2]>b[2])
              return 1;
            else if(a[2]<b[2])
              return -1;
            else
              return 0;
          });
          var topScore = candidates[0][2];
          var topScorers = [];
          candidates.forEach(function(candidate,candidateIndex){
            if(candidate[2] == topScore) {
              topScorers.push(candidate);
            }
          });
          if(topScorers.length>1) {
            // TODO
            // choose random candidate
            var randomIndex = Math.floor(Math.random() * (topScorers.length-1));
            assignPile.push([entry,topScorers[randomIndex][0]]);
            tutorsList[tutorNames.indexOf(topScorers[randomIndex][0])][3] ++;
          }
          else{
            assignPile.push([entry,topScorers[0][0]]);
            tutorsList[tutorNames.indexOf(topScorers[0][0])][3] ++;
          }
        }
      } // ^
    }
    else {
      warningPile.push([entry[4],"No tutors available at that time"]);
    }
  });
}

// check for intended sched, get list of available tutors
function parseTableCell(rawStringContent) {
  if(rawStringContent != " " && rawStringContent != "") {
    var availableTutors = [];
    var offering = rawStringContent.split(";");
    offering.forEach(function(tutorBundle,tutorBundleIndex){
      var name = tutorBundle.split(":")[0];
      var subjects = tutorBundle.split(":")[1].split(",");
      availableTutors.push( [name, subjects] );
    });
    return availableTutors;
  }
  return null;
}

// TODO
// output to sheet once more
function writeProgramOutput(signUpSheet) {
  // iterate through the assignPile array:
  var signUpRange = signUpSheet.getRange(16,1,signUpSheet.getLastRow()-16+1,9);
  assignPile.forEach(function(assignment,assignmentIndex){
    signUpRange.getCell(assignment[0][4]+1,9).setValue(assignment[1]);
  });
  warningPile.forEach(function(warning,warningIndex){
    signUpRange.getCell(warning[0]+1,9).setValue(warning[1]);
  });
  // find sheet row number using entry[4] call
  // write the name of the assigned person on the 8th column (experimental column)
}
