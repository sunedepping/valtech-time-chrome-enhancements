// ==UserScript==
// @name       Import from Toggler
// @namespace  NaviWEB
// @version    0.10
// @description  Imports data from Toggl
// @match      http://time.valtech.dk/registration/reg_day_edit.asp*
// @require  https://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js
// @require  https://raw.github.com/carhartl/jquery-cookie/master/jquery.cookie.js
// @downloadURL https://raw.github.com/sunetjensen/valtech-time-chrome-enhancements/master/ImportFromToggl.user.js
// @updateURL https://raw.github.com/sunetjensen/valtech-time-chrome-enhancements/master/ImportFromToggl.user.js
// @copyright  2012+, Sune Jensen & Gunnar Hafdal
// ==/UserScript==
function fillTimeRegistrationLine(project, activity, description, time) {
    
    for(var i = 6; i < $("input").length; i = i + 9) {
        //console.log("Compare: " + $("input")[i].value + " === " + project);
        
        if($("input")[i].value === project && $("input")[i-1].value === activity && ($("input")[i+6].value === "" || $("input")[i+6].value === description)) {
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
function createTimeTask(project, activity, description, time){
    var task = {};
    task.project = project;
    task.activity = activity;
    task.description = description;
    task.time = time;
    return task;
};
function processTogglDataError(jqXHR, textStatus, errorThrown) {
    console.log("Error:" + textStatus);
}
function processTogglData(json) {
    if(json.data.length == 0) {
        alert("No time entries found");
        return false;
    }
    
    console.log ("JSON data fetched from Toggl");
    
    var registration = [];
    
    $.each(json.data, function(idx, reg) {
        //console.log(reg);
        //console.log("ID: " + idx + ", Start: " + reg.start);
        
        if(reg.stop == null) {
            alert("Your timer is still running for "+reg.description);
        }
        else {
            var seconds = reg.duration-59;
            
            if(seconds < 1) {
                return true;
            }
                
            var time = Math.ceil((seconds/60/60)*4)/4;
            
            var description = reg.description;
            
            if(reg.project == null || reg.project.name == null) {
                alert("No project selected for time entry: " + reg.description);
                return true;
            }
            var project = reg.project.name.match(/^([a-zA-Z]+-[0-9]+): ([0-9]+)/);
            
            if(project == null || project.length != 3) {
                alert("Couldn't parse project description: " + reg.project.name);
                return true;
            }
            
            //console.log("Found project: " + project[1] + ", Activity: " + project[2]);
            var task = false;
            if(registration.length === 0){
                task = createTimeTask(project[1], project[2], description, time);
            } else {
                for (var i = registration.length - 1; i >= 0; i--) {
                    var r = registration[i];
                    if(r.project===project[1] && r.activity === project[2] && r.description === description){
                        r.time = time + r.time;
                        task = false;
                    } else {
                        task = createTimeTask(project[1], project[2], description, time);
                    }
                }
            }
            
            if(task){
                registration.push(task);
            }
        }
    });
    
    
    for (var i = registration.length - 1; i >= 0; i--) {
        var r = registration[i];
        if(!fillTimeRegistrationLine(r.project, r.activity,r.description,r.time)){
            alert("You need to add a task line to "+r.project+":"+r.activity+" to be able to add your time for the task: \""+r.description+"\"");
        }
    }
    
    
    
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
function fetchFromToggl() {
    var api_key = $.cookie("toggl_api_key");
    if(!api_key) {
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
    
    //console.log(start_date.toJSON() + " - " + end_date.toJSON());
    var url = "https://www.toggl.com/api/v6/time_entries.json";
    
    $.ajax({
        url: url,
        dataType: "json",
        username: api_key,
        password: "api_token",
        success: processTogglData,
        error: processTogglDataError,
        data: {
            start_date: start_date.toJSON(), 
            end_date: end_date.toJSON()
        }
        
    }); 
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