// ==UserScript==
// @name       Auto Login
// @namespace  NaviWEB
// @version    0.1
// @description  Makes you automatically login when entering the time.valtech.dk
// @match      http://time.valtech.dk/start_login.asp
// @require  https://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js
// @require  https://raw.github.com/carhartl/jquery-cookie/master/jquery.cookie.js
// @downloadURL https://raw.github.com/sunetjensen/valtech-time-chrome-enhancements/master/AutoLogin.user.js
// @updateURL https://raw.github.com/sunetjensen/valtech-time-chrome-enhancements/master/AutoLogin.user.js
// @copyright  2013+, Sune Jensen
// ==/UserScript==

$(document).ready(function() {
    console.log("Starting to auto login");
    
    var username = $.cookie("username");
    if(!username) {
        username = prompt("Brugernavn", "");
        $.cookie("username", username, { expires: 365 });
    }
    
    var password = $.cookie("password");
    if(!password) {
        password = prompt("Adgangskode", "");
        $.cookie("password", password, { expires: 365 });
    }
    
    $("#text1").val(username);
    $("#password1").val(password);
    
    $("form[name=test]").submit();
});