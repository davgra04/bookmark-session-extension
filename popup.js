"use strict";

// remain platform independent
if (typeof browser === "undefined") {
    var browser = chrome;
}


function formattedDate(date) {
    let dayStr = String(date.getDate()).padStart(2, "0");
    let monthStr = String(date.getMonth() + 1).padStart(2, "0");
    let yearStr = String(date.getFullYear());

    let dateFmtOpts = {
        weekday: "short"
    };
    let dayOfWeekStr = new Intl.DateTimeFormat("en-US", dateFmtOpts).format(date);

    return `${yearStr}-${monthStr}-${dayStr} (${dayOfWeekStr})`;
}


function log(message, includeImage = false) {

    let messageDiv = document.createElement("div");
    messageDiv.className = "logMessageDiv";



    if (includeImage) {
        let img = document.createElement("img");
        img.src = browser.runtime.getURL("images/icon32.png");
        img.className = "bookmarkImage";
        messageDiv.appendChild(img);

        // let imgUrl = browser.runtime.getURL("images/icon32.png");
        // htmlToAppend += `<img class="bookmarkImage" src="${imgUrl}">`;
    }

    let messageText = document.createElement("span");
    messageText.innerText = message;
    messageText.className = "message";
    messageDiv.appendChild(messageText);
    // // htmlToAppend += message
    // messageDiv.innerText += message;

    loggingDiv.append(messageDiv);
}


function bookmarkTabs(windows, sessionFolder, windowFolder) {

    let win = windows[0];

    browser.tabs.query({
        windowId: win.id
    }, function (arrayOfTabs) {

        // create bookmarks for tabs in window
        for (let i = 0; i < arrayOfTabs.length; i++) {
            browser.bookmarks.create({
                "parentId": windowFolder.id,
                "url": arrayOfTabs[i].url,
                "title": arrayOfTabs[i].title
            });
        }

        log(`bookmarked ${arrayOfTabs.length} tabs for ${windowFolder.title}`, true);

        if (windows.length == 1) {
            return;
        } else {
            windows.shift();
            createWindowFolders(windows, sessionFolder);
        }

    });

}


function createWindowFolders(windows, sessionFolder) {

    let win = windows[0];
    let windowFolderName = "Window " + String(win.id);

    browser.bookmarks.create({
            "parentId": sessionFolder.id,
            "title": windowFolderName
        },
        function (windowFolder) {
            bookmarkTabs(windows, sessionFolder, windowFolder);
        }
    );

}


function getAllWindows(yearFolder) {
    browser.windows.getAll(function (windows) {
        createWindowFolders(windows, yearFolder);
    });
}


function createSessionFolder(yearFolder) {

    let sessionFolderName = formattedDate(date) + " Session";

    // Get the current session folder
    browser.bookmarks.search({
        title: sessionFolderName,
        "url": undefined
    }, function (results) {

        if (results.length == 0) {
            // create current session folder
            log(`creating folder "${sessionFolderName}"`);

            browser.bookmarks.create({
                    "parentId": yearFolder.id,
                    "title": sessionFolderName
                },
                getAllWindows
            );

        } else {
            getAllWindows(results[0]);
        }
    });

}


function createYearFolder(pastSessionsFolder) {

    let year = date.getFullYear()
    let yearFolderName = `${year} Sessions`;

    // Get the current year folder
    browser.bookmarks.search({
        title: yearFolderName,
        "url": undefined
    }, function (results) {

        if (results.length == 0) {
            // create current year folder
            log(`creating folder "${yearFolderName}"`);

            browser.bookmarks.create({
                    "parentId": pastSessionsFolder.id,
                    "title": yearFolderName
                },
                createSessionFolder
            );
        } else {
            createSessionFolder(results[0]);
        }
    });

}


function start() {

    date = new Date();
    let pastSessionsFolderName = "past sessions";

    // Get the past sessions folder
    browser.bookmarks.search({
        title: "past sessions",
        "url": undefined
    }, function (results) {

        if (results.length == 0) {
            // create past sessions folder
            log(`creating folder "${pastSessionsFolderName}"`);

            browser.bookmarks.create({
                    "title": pastSessionsFolderName
                },
                createYearFolder
            );

        } else {
            createYearFolder(results[0]);
        }

    });

}

var date;
var bookmarkSessionButton = document.getElementById("bookmarkSessionButton");
var loggingDiv = document.getElementById("loggingDiv");

bookmarkSessionButton.addEventListener("click", start);