// ==UserScript==
// @name       Add activity
// @namespace  NaviWEB
// @version    0.9
// @description  Makes it possible to add an activity in chrome browser and add activities to Toggl.
// @match      http://time.valtech.dk/registration/reg_activity_edit.asp*
// @require  https://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js
// @require  https://raw.github.com/carhartl/jquery-cookie/master/jquery.cookie.js
// @downloadURL https://raw.github.com/sunetjensen/valtech-time-chrome-enhancements/master/AddActivity.user.js
// @updateURL https://raw.github.com/sunetjensen/valtech-time-chrome-enhancements/master/AddActivity.user.js
// @copyright  2012+, Sune Jensen
// ==/UserScript==

var posts = [];
var current = -1;
var customer;
var workspace;
var api_key;

function createPostError(data) {
    console.log ("Customer already existed (assumed, based on error)");
    handlePost();
}

function createPostSuccess(json) {
    if(json == null || json.length == 0) {
        alert("No project data returned with project creation");
        return false;
    }
    console.log ("Customer created at Toggl");
    
    handlePost();
}

function handlePost() {
    current++;
       
    if(typeof posts[current] == "undefined") {
        updateStatus("All done! :-)");
        return false;
    }
    
    updateStatus("Creating " + (current + 1) + " out of " + posts.length);
    console.log("Creating " + (current + 1) + " out of " + posts.length);
    
    current_post = posts[current];
    
    if(current_post.name != '' && current_post.code != '') {
        console.log("Sending post to Toggl: " + customer.code + ': ' + current_post.code + ' ' + current_post.name);
        $.ajax(
            "https://www.toggl.com/api/v8/projects",
            { 
        	    dataType: "json",
        	    contentType: "application/json; charset=utf-8",
        	    type: "POST",
        	    success: createPostSuccess,
        	    error: createPostError,
        	    data: JSON.stringify({
                	project: {
                        name: customer.code + ': ' + current_post.code + ' ' + current_post.name, 
                    	wid: workspace,
                        is_private: false,
                        cid: customer.toggl_id
                	}
            	}),
            	beforeSend: function (xhr) {
                	xhr.setRequestHeader("Authorization", "Basic " + btoa(api_key + ":api_token"));
            	}
        	}
    	);    
    }
    else {
        alert("Invalid post name: " + current_post.code + " " + current_post.name);
        handlePost();
    }
}

function createCustomerSuccess(json) {
    if(json == null || json.length == 0) {
        alert("No customer data returned with customer creation");
        return false;
    }
    updateStatus("Customer created at Toggl");
    
    customer.toggl_id = json.data.id;
    console.log("Using Toggl customer id: " + customer.toggl_id);
    
    handlePost();
}    
    
function getCustomerListSuccess(json) {
    if(json == null || json.length == 0) {
        alert("No customer entries found");
        return false;
    }
    updateStatus("Customers fetched from Toggl!");
    console.log ("JSON costumers fetched from Toggl");
    
    // Finding the current used project
    $.each(json, function(i, c) {
        if(c.name == customer.name) {
            console.log("Found customer from Toggl data: " + c.name + " == " + customer.name);
            customer.toggl_id = c.id;
            return false;
        }
    });
    
    // Did we find the customer
    if(typeof customer.toggl_id == "undefined") {
    	updateStatus("Communicating with Toogl....");
        $.ajax(
    	    "https://www.toggl.com/api/v8/clients",
       		{ 
        	    dataType: "json",
        	    contentType: "application/json; charset=utf-8",
        	    type: "POST",
        	    success: createCustomerSuccess,
        	    error: processTogglDataError,
        	    data: JSON.stringify({
                	client: {
                    	name: customer.name, 
                    	wid: workspace
                	}
            	}),
            	beforeSend: function (xhr) {
                	xhr.setRequestHeader("Authorization", "Basic " + btoa(api_key + ":api_token"));
            	}
        	}
    	);        
    }
    else {
        handlePost();
    }
}

function processTogglDataError(jqXHR, textStatus, errorThrown) {
    updateStatus(":-(");
    alert("Argh, we were unable to fetch your toggl time registrations!#% You might try to check your toggl_api_key cookie or just ask that stupid dev...");
    console.log("Error:" + textStatus);
}
    
function addPostsToToggl() {
    // Find posts with checked checkbox
    updateStatus("Initiating...");
    var checked = $("input:checked");
    $.each(checked, function(index, checkbox) {
        post_code = checkbox.name;
        post_name = $("input:checked:eq("+index+")").parent().parent().children("td:nth-child(3)").html();
        
        console.log("Found post: " + post_code + " " + post_name);
        
        posts.push({name: post_name, code: post_code});
        
    });
    
    if(posts.length == 0) {
        alert("Hey, if you want to add posts to Toggl, you need the check'em first!");
        return false;
    }
    
    // Finding customer data
    customer_field = $("#Table3 td:nth-child(2) b").html();
    customer_parts = customer_field.split("&nbsp;-&nbsp;");
    customer = {
        code: $("#Table3 td:nth-child(1) b").html(),
        name: customer_parts[1]
    };
    console.log("Found customer: " + customer.code + " " + customer.name);
    
    // Defining api key
    api_key = $.cookie("toggl_api_key");
    if(!api_key || api_key == "null") {
        api_key = prompt("Toggl API key", "");
        $.cookie("toggl_api_key", api_key, { expires: 365 });
    }
    console.log("API key used: " + api_key);
    
    // Defining workspace id
    workspace = $.cookie("toggl_workspace");
    if(!workspace || workspace == "null") {
        workspace = prompt("Toggl workspace id\n\nYou find it on toggl.com by logging in. \nClick to Settings > Workspace. \nRight-click on workspace name in the right column. \nClick 'Inspect element' and take the value of the data-id attribute", "");
        $.cookie("toggl_workspace", workspace, { expires: 365 });
    }
    console.log("Workspace id used: " + workspace); 
    
    // Fetch existing customers
    updateStatus("Communicating with Toogl...");
    $.ajax(
        "https://www.toggl.com/api/v8/workspaces/" + workspace + "/clients",
        { 
            dataType: "json",
            success: getCustomerListSuccess,
            error: processTogglDataError,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "Basic " + btoa(api_key + ":api_token"));
            }
        }
    );
}

function updateStatus(status, go_green) {
    $("#AddActivityStatus").html(status);
}

$(document).ready(function() {
    console.log("Starting to modify HTML...");
    console.log("Found div: " + $("#BottomDiv").length);
    formcontent = $("#BottomDiv").html();
    $("#BottomDiv").replaceWith("<form action=\"_add_activity.asp\" id=\"CustomForm\" name=\"form1\" method=\"post\"><div class=\"MainDiv\" id=\"BottomDiv\">" + formcontent + "</div></form>");
    $("#BottomDiv").bind("DOMSubtreeModified", function () {
        if($("#addPostsToToggl").length == 0) {
            $("#BottomDiv").after("<div style=\"float: right\" id=\"AddActivityStatus\"><input type=\"button\" name=\"addPostsToToggl\" id=\"addPostsToToggl\" value=\"Add posts to Toggl\" /></div>");
            $("#addPostsToToggl").click(addPostsToToggl);
        }
    });        
});