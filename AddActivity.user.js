// ==UserScript==
// @name       Add activity
// @namespace  NaviWEB
// @version    0.2
// @description  Makes it possible to add an activity in chrome browser
// @downloadURL https://raw.github.com/sunetjensen/valtech-time-chrome-enhancements/master/AddActivity.user.js
// @updateURL https://raw.github.com/sunetjensen/valtech-time-chrome-enhancements/master/AddActivity.user.js
// @match      http://time.valtech.dk/registration/reg_activity_edit.asp*
// @copyright  2012+, Sune Jensen
// ==/UserScript==

function load(){
    formcontent = document.getElementById("BottomDiv").outerHTML;
    document.getElementById("BottomDiv").outerHTML = "<form action=\"_add_activity.asp\" id=\"CustomForm\" name=\"form1\" method=\"post\">" + formcontent + "</form>";
}

window.addEventListener('load', load);