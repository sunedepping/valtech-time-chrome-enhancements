// ==UserScript==
// @name       Add activity
// @namespace  NaviWEB
// @version    0.3
// @description  Makes it possible to add an activity in chrome browser
// @match      http://time.valtech.dk/registration/reg_activity_edit.asp*
// @require  https://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js
// @downloadURL https://raw.github.com/sunetjensen/valtech-time-chrome-enhancements/master/AddActivity.user.js
// @updateURL https://raw.github.com/sunetjensen/valtech-time-chrome-enhancements/master/AddActivity.user.js
// @copyright  2012+, Sune Jensen
// ==/UserScript==

$(document).ready(function() {
    console.log("Starting to modify HTML...");
    console.log("Found div: " + $("#BottomDiv").length);
    formcontent = $("#BottomDiv").html();
    $("#BottomDiv").replaceWith("<form action=\"_add_activity.asp\" id=\"CustomForm\" name=\"form1\" method=\"post\"><div class=\"MainDiv\" id=\"BottomDiv\">" + formcontent + "</div></form>");
});
