var schedBlocks = [];
// with reference to instructions array
var tutorNames = [];
var tutorEmails = [];
var tutorSubjects = [];

var weekTutorsList = []; // array of tutors who have sent the form for the week
var instructions = [];

// with reference to weekTutorsList array
var hoursCompleted = [];

// variables for generating program keys for tutor selection
var subjectKeys = []; // array of objects containing key string and tutor names

function generateSchedule() {

// program variable set-up
  
  var schedBlockSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Schedules");
  var tutorResponseSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Tutors Schedule");
  var subjectAssignmentSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Tutor Subject Assignments"); 
  var tutorHoursTallySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Tutor Hours Tally");
  var programInputSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Program Input")

// pre-run functions
  getSchedBlocks(schedBlockSheet); // get schedule blocks on the calendar and save into an array
  getTutorList(subjectAssignmentSheet); // get the list of tutors in the subject assingment sheet
  getFormResponders(tutorResponseSheet); // get the list of responders for the week
  instructions.sort(); // sort the writing instructions for the calendar
// save hours information into sheet
  saveHours(tutorHoursTallySheet); // update the record of hours for a tutor and set the current limit to two
  generateProgramInput(); // generate list of items required for tutor dropdown list mechanism
  clearTable(schedBlockSheet,programInputSheet); // clear both the schedule calendar and the table
// schedule write on sheet
  writeToSheet(schedBlockSheet); // write the calendar schedule and the notes display
  writeInputToSheet(programInputSheet); // write the list of items required for tutor dropdown list mechanism
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
    var subjectItem = item[2];
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
        if( parsedInstructions != null ) {
          instructions = instructions.concat(parsedInstructions);
        }
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

function writeInputToSheet (programInputSheet) {
  var subjectKeysSize = subjectKeys.length;
  var subjectKeysTableRange = programInputSheet.getRange(2, 1, subjectKeysSize,2);
  for( var i = 0 ; i < subjectKeysSize ; i ++ ) {
    var subjectTutorName = subjectKeys[i][0];
    subjectKeysTableRange.getCell(i+1, 1).setValue(subjectTutorName);
    var nameWriteString = "";
    
    subjectKeys[i][1].forEach(function(name,index){
      nameWriteString += ( name + "," );
    });
    var result = nameWriteString.substring(0, nameWriteString.length-1);
    subjectKeysTableRange.getCell(i+1, 2).setValue(result);
  }
}

// save the hours commitment and hours served for the week

function saveHours(tutorHoursTallySheet) {
  // get tutor hours tally range
  var tutorHoursTallyRange = tutorHoursTallySheet.getRange(2,1,tutorHoursTallySheet.getLastRow(),tutorHoursTallySheet.getLastColumn());
  var tutorHoursTallyRangeValues = tutorHoursTallyRange.getValues();
  var hoursTallyEmailsList = [];
  // get list of emails
  tutorHoursTallyRangeValues.forEach(function(item,index){
    hoursTallyEmailsList.push(item[1]);
  });
  // iterate over weekly tutors list to save hours:
  weekTutorsList.forEach(function(item,index){
    var writeRow = hoursTallyEmailsList.indexOf(item[1]) + 1;
    var currHoursComp = hoursCompleted[index];
    var prevHourServed = tutorHoursTallyRangeValues[writeRow-1][3];
    var prevAdd = (prevHourServed == "") ? 0 : prevHourServed;
    tutorHoursTallyRange.getCell(writeRow,4).setValue( ( prevAdd + currHoursComp ) );
    tutorHoursTallyRange.getCell(writeRow,3).setValue( 2 );
  });
}

function clearTable(schedBlockSheet,programInputSheet) {
  var schedTableRange = schedBlockSheet.getRange("C4:I17");
  if(programInputSheet.getLastRow()!=1) {
    var programInputRange = programInputSheet.getRange(2, 1,programInputSheet.getLastRow()-1,2);
    programInputRange.clear({contentsOnly: true});
    schedTableRange.clear({contentsOnly: true});
    schedTableRange.clear({commentsOnly: true});
  }
}

function generateProgramInput() { // generate the program input from the instructions array
//  subjectKeys Format: [["Economics;0-1",["gabriel","poum"]]];
  var uniqueKeysAlone = [];
  instructions.forEach(function(instr,instrIdx){
    var instrTutorSubj = weekTutorsList[instr[2]][2]; // get the tutors subject
    var instrTutorName = weekTutorsList[instr[2]][0]; // get tutor name
    instrTutorSubj.forEach(function(subj,subjIdx){
      var uniqueKeyString = subj + ";" + instr[0] + "-" + instr[1];
      if( uniqueKeysAlone.indexOf(uniqueKeyString) > -1 ) { // check if the key already exists
        for( var i = 0 ; i < subjectKeys.length ; i ++ ) { // iterate over the current list and append name to uniqueKey already generated
          if( uniqueKeyString == subjectKeys[i][0] ) {
            subjectKeys[i][1] = subjectKeys[i][1].concat(instrTutorName); // add name of tutor
            break;
          }
        }
      }
      else {
        uniqueKeysAlone.push(uniqueKeyString); // add to identifier array the name of the element
        var uniqueKeysArraywithSubject = [ uniqueKeyString , [instrTutorName] ];
        subjectKeys.push(uniqueKeysArraywithSubject);
      }
    });
  });
}
