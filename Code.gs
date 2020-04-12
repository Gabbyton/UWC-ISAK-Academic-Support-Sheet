var start_row = 15;
var subj_col = 2;
var pref_Tutor_col = 5;
var date_edit_col = 7;
var Tutor_list_subj_dist = 3;

var timesArray = [
  "07:00-08:00",
  "08:00-09:00",
  "09:00-10:00",
  "10:00-11:00",
  "11:00-12:00",
  "12:00-13:00",
  "13:00-14:00",
  "14:00-15:00",
  "15:00-16:00",
  "16:00-17:00",
  "17:00-18:00",
  "18:30-19:30",
  "19:30-20:15",
  "20:30-21:30"
];

var daysArray = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

function onEdit(e) {
  ws = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sign Up");
  
  var activeCell = e.range;
  var r = activeCell.getRow();
  var c = activeCell.getColumn();
  
  
  if ( activeCell.getSheet().getName() == "Sign Up" && r > start_row ) {
  var wsoptions = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Program Input");
  if(c > 1 && c < 5 ) {
    var subject = ws.getRange(r,2,1).getValue().toString();
    var date = ws.getRange(r,3,1).getValue().toString();
    var time = ws.getRange(r,4,1).getValue().toString();
    var dateIndex = daysArray.indexOf(date);
    var timeIndex = timesArray.indexOf(time);
    var datetime = timeIndex + "-" + dateIndex;
    var prefTutorCell = ws.getRange( r , pref_Tutor_col ,1 );
    if( dateIndex >= 0 && timeIndex >= 0 && subject != "" ) {
      var tutorIndexCell = ws.getRange(r,6,1);
      var uniqueKey = subject + ";" + datetime;
      var getListReturnValue = getList( uniqueKey , wsoptions );
      var dateEditCell = ws.getRange( r , date_edit_col , 1 );
      prefTutorCell.setValue("");
      setValidationRule( getListReturnValue[0] , prefTutorCell );
      tutorIndexCell.setValue(getListReturnValue[1]);
    }
  }
  
  dateEditCell.setValue( new Date() );
  }
}

function getList( uniqueKey , wsoptions ) {
  
  var optionsRange = wsoptions.getRange(2,1,wsoptions.getLastRow()-1,2);
  var numRows = optionsRange.getNumRows();
  var numCols = optionsRange.getNumColumns();
  var TutorNames = ["no tutors available at the time"];
  var tutorIndex = -1;
  for( var i = 0 ; i < numRows ; i ++ ) {
    var optionKey = optionsRange.getCell(i+1,1).getValue().toString();
    if(optionKey == uniqueKey ) {
      var nameList = optionsRange.getCell(i+1,2).getValue().toString()
      TutorNames = nameList.split(",");
      tutorIndex = i+1;
      break;
    }
  }
  return [TutorNames,tutorIndex];
}

function setValidationRule(list, cell) {
  
  var newRule = SpreadsheetApp
  .newDataValidation()
  .requireValueInList(list)
  .setAllowInvalid(false)
  .build();
  
  cell.setDataValidation(newRule);
}
