var start_row = 15;
var subj_col = 2;
var pref_Tutor_col = 5;
var date_edit_col = 7;
var Tutor_list_range = "A2:C38";
var Tutor_list_subj_dist = 3;

function onEdit(e) {
  ws = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sign Up");
  
  var activeCell = e.range;
  var r = activeCell.getRow();
  var c = activeCell.getColumn();
  if( activeCell.getSheet().getName() == "Sign Up" && c == subj_col && r > start_row ) {
    var val = activeCell.getValue();
    var numRows = activeCell.getNumRows();
    var prefTutorCell = ws.getRange( r , pref_Tutor_col , numRows );
    var dateEditCell = ws.getRange( r , date_edit_col , numRows );
    if(val == "") {
      prefTutorCell.clear();
      prefTutorCell.setDataValidation(null);
    }
    else {
      prefTutorCell.clear();
      setValidationRule( getList( val ) , prefTutorCell );
    }
    dateEditCell.setValue( new Date() );
  }
  
}

function getList( value ) {
  wsoptions = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Tutor Subject Assignments");
  var optionsRange = wsoptions.getRange( Tutor_list_range );
  var numRows = optionsRange.getNumRows();
  var numCols = optionsRange.getNumColumns();
  var TutorNames = [];
  for( var i = 2 ; i <= numRows ; i ++  ) {
    var compVal = optionsRange.getCell( i , Tutor_list_subj_dist ).getValue();
    if( compVal == value ) { 
      TutorNames.push( optionsRange.getCell(i, 1).getValue() );
    }
  }
  return TutorNames;
}

function setValidationRule(list, cell) {
  
  var newRule = SpreadsheetApp
  .newDataValidation()
  .requireValueInList(list)
  .setAllowInvalid(false)
  .build();
  
  cell.setDataValidation(newRule);
}
