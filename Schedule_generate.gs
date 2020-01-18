var schedBlocks = [];
// with reference to instructions array
var tutorNames = [];
var tutorEmails = [];
var tutorSubjects = [];

var weekTutorsList = []; // array of tutors who have sent the form for the week
var instructions = [];

// with reference to weekTutorsList array
var hoursCommitted = [];
var hoursCompleted = [];

function generateSchedule() {

// program variable set-up
  
  var schedBlockSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Schedules");
  var tutorResponseSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Tutors Schedule");
  var subjectAssignmentSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Tutor Subject Assignments");
  var tutorHoursTallySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Tutor Hours Tally");

// pre-run functions
  getSchedBlocks(schedBlockSheet);
  getTutorList(subjectAssignmentSheet);
  getFormResponders(tutorResponseSheet);
  instructions.sort();
// save hours information into sheet
  saveHours(tutorHoursTallySheet);
// schedule write on sheet
  clearTable(schedBlockSheet);
  writeToSheet(schedBlockSheet);
}

function getSchedBlocks( schedBlockSheet ) {
  var schedBlockRangeValues = schedBlockSheet.getRange(4, 2,14).getValues();
  schedBlockRangeValues.forEach( function( item, index ) {
    schedBlocks.push( item[0] );
  });
}

function getTutorList(subjectAssignmentSheet) {
  var subjectAssignmentRangeValues = subjectAssignmentSheet.getRange(2, 1, subjectAssignmentSheet.getLastRow()-1, subjectAssignmentSheet.getLastColumn()).getValues();
  subjectAssignmentRangeValues.forEach( function(item,index) {
    if( tutorEmails.indexOf(item[1]) == -1 ) {
      tutorEmails.push(item[1]);
    }
    var tutorEmailsIndex = tutorEmails.indexOf(item[1]);
    var subjectItem = item[2] + " (" + item[3] + ")";
    tutorNames[ tutorEmailsIndex ] = item[0];
    if( tutorSubjects[tutorEmailsIndex] == null ) {
      tutorSubjects[tutorEmailsIndex] = [subjectItem];
    }
    else {
      tutorSubjects[tutorEmailsIndex] = tutorSubjects[tutorEmailsIndex].concat(subjectItem);
    }
  });
}

//get form responses

function getFormResponders(tutorResponseSheet) {
  var tutorResponseRangeValues = tutorResponseSheet.getRange(2, 2, tutorResponseSheet.getLastRow()-1, tutorResponseSheet.getLastColumn()-1).getValues();
  tutorResponseRangeValues.forEach( function( item , index ) {
    if( item[0] != "" ) {
      var tutorObject = findTutor(item[0]);
      weekTutorsList.push( tutorObject );
      // for each day of week column, parse the csv schedules
      for( var day = 2 ; day <= 8 ; day ++ ) {
        var parsedInstructions = parseSchedule(item[0],weekTutorsList.indexOf(tutorObject),day,item[day]);
        if( parsedInstructions != null )
          instructions = instructions.concat(parsedInstructions);
      }
      hoursCompleted[weekTutorsList.indexOf(tutorObject)] = item[1];
    }
  });
}



function findTutor( tutorEmail ) {
  var tutorEmailsIndex = tutorEmails.indexOf(tutorEmail);
  var tutorName = tutorNames[tutorEmailsIndex];
  var tutorSubjectsArray = tutorSubjects[tutorEmailsIndex];
  var tutorObject = [tutorName,tutorEmail,tutorSubjectsArray];
  return tutorObject;
}

function parseSchedule(tutorEmail,tutorIndex,day,rawCSVString) {
  if(rawCSVString == "")
    return null;
  var parsedInstructions = [];
  var stringScheduleBlocks = rawCSVString.split(", ");
  if(stringScheduleBlocks.length == 0) {
    stringScheduleBlocks = [rawCSVString];
  }
  stringScheduleBlocks.forEach(function(item,index){
    var rowNumber = schedBlocks.indexOf(item);
    var colNumber = day - 2;
    var instruction = [rowNumber,colNumber,tutorIndex];
    parsedInstructions.push(instruction);
    
    // increment the number of hours committed into a new array that takes the tutorIndex as reference
    if( hoursCommitted[tutorIndex] == null )
      hoursCommitted[tutorIndex] = 0;
    hoursCommitted[tutorIndex] ++;
  });
  return parsedInstructions;
}

// for each of the elements on the instructions, write and set notes

function writeToSheet(schedBlockSheet) {
  var schedTableRange = schedBlockSheet.getRange("C4:I17");
  var currRow = instructions[0][0];
  var currCol = instructions[0][1];
  var TutorObjectsToWrite = [];
  instructions.forEach(function(instr,instrIdx){
    var row = instr[0];
    var col = instr[1];
    if( row != currRow || col != currCol ) {
      var writeRow = instructions[instrIdx-1][0] + 1;
      var writeCol = instructions[instrIdx-1][1] + 1;
      var writeString = "";
      TutorObjectsToWrite.forEach(function(tutorObj,tutorObjIdx){
        writeString += weekTutorsList[tutorObj][0] + ":";
        weekTutorsList[tutorObj][2].forEach(function(subject,subjIdx){
          writeString += subject;
          writeString += ",";
        });
        if(tutorObjIdx<TutorObjectsToWrite.length-1)
          writeString += ";";
      });
      schedTableRange.getCell(writeRow,writeCol).setValue(writeString);
      TutorObjectsToWrite = [];
      currCol = col;
      currRow = row;
    }
    TutorObjectsToWrite.push(instr[2]);
  });
  
  // write notes to optimize display
  for(var i = 1 ; i <= 14 ; i ++) {
    for( var j = 1 ; j <= 7 ; j ++ ) {
      var cellContentString = schedTableRange.getCell(i,j).getValue();
      if(cellContentString != "" && cellContentString != " ") {
        var cellContentArray = cellContentString.split(";");
        var writeString = "Tutors Available:\n\n";
        if( cellContentArray.length == 0 )
          cellContentArray = [cellContentString];
        cellContentArray.forEach(function(rowListing,rowListingIdx){
          var rowListingSplit = rowListing.split(":");
          var name = rowListingSplit[0];
          var subjects = rowListingSplit[1].split(",");
          if(subjects.length == 0)
            subjects = [rowListingSplit[1]];
          Logger.log(subjects);
          writeString += name + "\n";
          subjects.forEach(function(displaySubj,displaySubjIdx){
            if(displaySubj != "") {
              writeString += "\t" + "-" + displaySubj;
              if(displaySubjIdx<subjects.length-1) {
                writeString += "\n";
              }
            }
          });
          if(rowListingIdx<cellContentArray.length-1) {
            writeString += "\n";
          }
        });
        schedTableRange.getCell(i,j).setNote(writeString);
      }
    }
  }
}

// save the hours commitment and hours served for the week

function saveHours(tutorHoursTallySheet) {
  // get tutor hours tally range
  var tutorHoursTallyRange = tutorHoursTallySheet.getRange(2,1,tutorHoursTallySheet.getLastRow()-1,tutorHoursTallySheet.getLastColumn()-1);
  var tutorHoursTallyRangeValues = tutorHoursTallyRange.getValues();
  var hoursTallyEmailsList = [];
  // get list of emails
  tutorHoursTallyRangeValues.forEach(function(item,index){
    hoursTallyEmailsList.push(item[1]);
  });
  // iterate over weekly tutors list to save hours:
  weekTutorsList.forEach(function(item,index){
    var writeRow = hoursTallyEmailsList.indexOf(item[1]) + 1;
    var currHoursComm = hoursCommitted[index];
    var currHoursComp = hoursCompleted[index];
    var prevHourServed = tutorHoursTallyRangeValues[writeRow-1][3];
    Logger.log(item[1] + ": " + prevHourServed);
    tutorHoursTallyRange.getCell(writeRow,3).setValue(currHoursComm);
    var prevAdd = (prevHourServed == "") ? 0 : prevHourServed;
    tutorHoursTallyRange.getCell(writeRow,4).setValue( ( prevAdd + currHoursComp ) );
  });
}

function clearTable(schedBlockSheet) {
  var schedTableRange = schedBlockSheet.getRange("C4:I17");
  schedTableRange.clear({contentsOnly: true});
  schedTableRange.clear({commentsOnly: true});
}
