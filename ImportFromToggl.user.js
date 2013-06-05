// ==UserScript==
// @name       Import from Toggler
// @namespace  NaviWEB
// @version    1.1
// @description  Imports data from Toggl
// @match      http://time.valtech.dk/registration/reg_day_edit.asp*
// @require  https://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js
// @require  https://raw.github.com/carhartl/jquery-cookie/master/jquery.cookie.js
// @downloadURL https://raw.github.com/sunetjensen/valtech-time-chrome-enhancements/master/ImportFromToggl.user.js
// @updateURL https://raw.github.com/sunetjensen/valtech-time-chrome-enhancements/master/ImportFromToggl.user.js
// @copyright  2013+, Sune Jensen
// ==/UserScript==

var time_entries;
var time_entry_key;
var registrations;
var api_key;

function fillTimeRegistrationLine(project, activity, description, time) {
    
    for(var i = 6; i < $("input").length; i = i + 9) {
        //console.log("Compare: " + $("input")[i].value + " === " + project);
        
        if($("input")[i].value === project && $("input")[i-1].value === activity && $("input")[i+6].value === "") {
            var timestring = ""+time;
            timestring = timestring.replace(".",",");
            
            console.log("Adding "+timestring+" to "+project+":"+activity+" on \""+description+"\"");
            $("input").eq(i+4).val(timestring);
            $("input").eq(i+6).val(description);
            
            return true;
        }
    }
    
    return false;
    
    // $.each(
    //1Arbejdstype
    //2Aktivitetskode
    //3Projectnr
    //4lineno
    //5BookedHours2
    //6oldqty
    //7qty
    //8olddescrip
    //9descrip
}

function processTogglDataError(jqXHR, textStatus, errorThrown) {
    alert("Argh, we were unable to fetch your toggl time registrations!#% You might try to check your toggl_api_key cookie or just ask that stupid dev...");
    console.log("Error:" + textStatus);
}

function processProjectDataFromToggl(json) {
    if(json == null || json.length == 0) {
        alert("We could no find project data!");
        return false;
    }
    
    var project = json.data.name;  
    console.log("Project " + project + " successfully loaded");
    
    project = project.match(/^([a-zA-Z]+-[0-9]+): ([0-9]+)/);
    if(project == null || project.length != 3) {
        alert("Couldn't parse project description: " + project);
        processNextTimeEntry();
        return false;
    }
            
    //console.log("Found project: " + project[1] + ", Activity: " + project[2]);
    var reg = time_entries[time_entry_key];
    var seconds = reg.duration;
    var time = Math.ceil((seconds/60/60)*4)/4;
    var description = reg.description;
    
    if(registrations.length > 0){
        for (var i = registrations.length - 1; i >= 0; i--) {
            if(registrations[i].project===project[1] && registrations[i].activity === project[2] && registrations[i].description === description) {
                registrations[i].time = registrations[i].time + time;
                console.log("Time added to existing registration for project: " + project);
                processNextTimeEntry();
                return false;
            }
        }
    }
    console.log("New entry added for project: " + project);
    registrations.push({project: project[1], activity: project[2], description: description, time: time});
    processNextTimeEntry();   
}

function processNextTimeEntry() {
    time_entry_key++;
       
    if(typeof time_entries[time_entry_key] === "undefined") {
        console.log ("Starting to fill " + registrations.length + " registrations to fields");
        for (var i = registrations.length - 1; i >= 0; i--) {
            var r = registrations[i];
            if(!fillTimeRegistrationLine(r.project, r.activity,r.description,r.time)){
                alert("You need to add a task line to "+r.project+":"+r.activity+" to be able to add your time for the task: \""+r.description+"\"");
            }
        }
        return false;
    }
    
    var reg = time_entries[time_entry_key];
    
    console.log ("Processing time entry "+reg.description);
    
    if(reg.stop == null) {
        alert("Your timer is still running for "+reg.description);
        processNextTimeEntry();
        return false;
    }
    
    if(reg.duration-59 < 1) {
        console.log ("Time less than a minute for time entry!");
        processNextTimeEntry();
        return false;
    }
            
    if(reg.pid == null) {
        alert("No project selected for time entry: " + reg.description);
        processNextTimeEntry();
        return false;
    }
    
    var url = "https://www.toggl.com/api/v8/projects/" + reg.pid;
    $.ajax(
        url,
        { 
            dataType: "json",
            type: "get",
            success: processProjectDataFromToggl,
            error: processTogglDataError,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "Basic " + btoa(api_key + ":api_token"));
            }
        }
    );
    
    //id: 49448529
    //description: PROACT-30: Writing User stories
    //billable: false
    //start: 2012-10-11T12:41:18+02:00
    //stop: 2012-10-11T13:49:28+02:00
    //duration: 4090
    //workspace: [object Object]
    //tag_names: 
    //ignore_start_and_stop: false
    //updated_at: 2012-10-11T13:50:24+02:00
    //user_id: 220015
    //project: [object Object]
}


function processTogglTimeEntries(json) {
    if(json == null || json.length == 0) {
        alert("No time entries found");
        return false;
    }
    
    console.log ("JSON time entries fetched from Toggl");
    
    time_entries = json;
    time_entry_key = -1;
    registrations = [];
    
    processNextTimeEntry();
}


function fetchFromToggl() {
    api_key = $.cookie("toggl_api_key");
    if(!api_key || api_key == "null") {
        api_key = prompt("Toggl API key", "");
        $.cookie("toggl_api_key", api_key, { expires: 365 });
    }
    console.log("API key used: " + api_key); 
    
    var date_string = document.getElementsByClassName("MainTopTitle")[0].innerHTML;
    
    console.log("Date string used: " + date_string); 
    
    var date_parts = /([0-9]{1,2})-([0-9]{1,2})-(201[1-9]{1})/i.exec(date_string);
    if(date_parts.length != 4) {
        alert("Unable to fetch date");
        return false;
    }
    
    var start_date = new Date(date_parts[3], date_parts[2]-1, date_parts[1]);
    var end_date = new Date(date_parts[3], date_parts[2]-1, date_parts[1], 23, 59, 59);
    
    console.log("Date range send to Toggl: " + start_date.toJSON() + " to " + end_date.toJSON());
    
    var url = "https://www.toggl.com/api/v8/time_entries";
    $.ajax(
        url,
        { 
            dataType: "json",
            success: processTogglTimeEntries,
            error: processTogglDataError,
            data: {
                start_date: start_date.toJSON(), 
                end_date: end_date.toJSON()
            },
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "Basic " + btoa(api_key + ":api_token"));
            }
        }
    );
}

$(document).ajaxStart(function(){ 
    $('#ajaxBusy').show(); 
}).ajaxStop(function(){ 
    $('#ajaxBusy').hide();
});

$(document).ready(function() {
    $('#Form2').before('<input type="button" value="Fetch from Toggl" id="fetchfromtoggl" /> <span id="ajaxBusy" style="display: none">Chatting up Toggl...</span>');
    console.log("Toggl button added");
    $('#fetchfromtoggl').click(fetchFromToggl);
});