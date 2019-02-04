
"use strict";

var date;


function pad(num, size) {

    if (size - num.length > 8) {

        size = num.length + 1
    }
    var s = "00000000" + num;
    return s.substr(s.length - size);
}


function formattedDate(date) {

    var dayOfWeekNames = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
    ]

    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
    var dayOfWeek = date.getDay();

    return year + "-" + pad(month, 2) + "-" + pad(day, 2) + " (" + dayOfWeekNames[dayOfWeek] + ")";
}


function log(msg) {
    document.getElementById("message").innerHTML += "<br>" + msg;
}


function bookmarkTabs(windows, sessionFolder, windowFolder) {

    var win = windows[0];

    chrome.tabs.query({ windowId: win.id }, function (arrayOfTabs) {

        // create bookmarks for tabs in window
        for (var i = 0; i < arrayOfTabs.length; i++) {
            chrome.bookmarks.create(
                {
                    "parentId": windowFolder.id,
                    "url": arrayOfTabs[i].url,
                    "title": arrayOfTabs[i].title
                }
            );
        }

        log("bookmarked " + arrayOfTabs.length + " tabs for " + windowFolder.title);

        if (windows.length == 1) {

            return
        } else {

            windows.shift()
            createWindowFolders(windows, sessionFolder);
        }

    });

}


function createWindowFolders(windows, sessionFolder) {

    var win = windows[0];
    var myTitle = "Window " + String(win.id);

    chrome.bookmarks.create(
        { "parentId": sessionFolder.id, "title": myTitle },
        function (windowFolder) {
            // log("    created folder " + myTitle)
            bookmarkTabs(windows, sessionFolder, windowFolder);
        }
    );

}


function getAllWindows(yearFolder) {
    chrome.windows.getAll(function (windows) {
        createWindowFolders(windows, yearFolder);
    });
}


function createSessionFolder(yearFolder) {

    var myTitle = formattedDate(date) + " Session";

    // Get the current session folder
    chrome.bookmarks.search({ title: myTitle, "url": undefined }, function (results) {

        if (results.length == 0) {

            // create current session folder
            log("current session folder doesn't exist. Creating...")

            chrome.bookmarks.create(
                { "parentId": yearFolder.id, "title": myTitle },
                getAllWindows
            );

        } else {

            getAllWindows(results[0]);
        }
    })


}


function createYearFolder(pastSessionsFolder) {

    var myTitle = String(date.getFullYear() + " Sessions");

    // Get the current year folder
    chrome.bookmarks.search({ title: myTitle, "url": undefined }, function (results) {

        if (results.length == 0) {
            // create current year folder
            log("current year folder doesn't exist. Creating...")

            chrome.bookmarks.create(
                { "parentId": pastSessionsFolder.id, "title": myTitle },
                createSessionFolder
            );

        } else {
            createSessionFolder(results[0]);
        }

    })

}


function start() {

    date = new Date();

    // Get the past sessions folder
    chrome.bookmarks.search({ title: "past sessions", "url": undefined }, function (results) {

        // for(var i=0; i<results.length; i++) {
        //     log(results[i].title);
        // }

        if (results.length == 0) {
            // create past sessions folder
            log("past sessions folder doesn't exist. Creating...")

            chrome.bookmarks.create(
                { "title": "past sessions" },
                createYearFolder
            );

        } else {
            createYearFolder(results[0]);
        }

    })

}


let saveSession = document.getElementById("saveSession");

saveSession.addEventListener("click", start);

