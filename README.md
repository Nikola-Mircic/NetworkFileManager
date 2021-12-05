# Network file manager v1.0

### Author: [Nikola-Mircic](https://github.com/Nikola-Mircic)

<br>
Application for sharing files between devices on a local network.

<br>

## Table of content: ##
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [How to use](#how-to-use) 

## Overview
Network file manager is a Node.js based application for distributing files over a local network. It has a simple UI with everything you need to select,send and even to check progress of transfering files.

NFM has proven to be very handy for transferring large files that cannot be sent in one piece. If it is necessary to send a large number of files, the program gives the user the option to send them together, and the recipient can download them all with the click of a single button.

To start sharing files, all u need is to start the Node.js application, and it will show you the URL which can be accessed from any browser on a PC, tablet or phone. More about that you can find in [how to use](#how-to-use) section;

## Prerequisites
To use this application you need to have:
- Node.js installed on a computer that runs the NFM
- Computer connected to the LAN

If you don't have Node.js installed, you can download it on [Node.js download page](https://nodejs.org/en/download/).

## Installation
To install this application on your computer, click [here](https://github.com/Nikola-Mircic/NetworkFileManager/archive/refs/heads/master.zip) and you will get a file called "NetworkFileManager-master.zip". After that, just extract all of its content to the empty folder and start the application.

## How to use
If you have a **start.bat** file in your folder, use it to run your application. If it closes after you opened it, check your <u>firewall settings and network connections</u>.

If you somehow didn't get the start.bat file or don't work, run the cmd window in the folder where the **server.js** file is. In the command window type:
> node server.js

In both cases you should see something like:
>Available networks: <br>
>  \- Wi-Fi <br>
>  \- Network 1 <br>
>  \- Network 2 <br>

Then you will be asked to select one of those by typing the name of the network you prefer.
If you want to run NFM on " localhost ", you can do that by simply typing `localhost` as an answer or just press ENTER button on your keyboard.

After you finish that, server will start on selected network.

> Server started on http://your_ip:80

In this message, NFM says that the system for writing transfer logs is working fine and the server is running. In the given URL, " your_ip " represents the IPv4 address of your device on the network. For example, your IP is:  187.68.1.7, and the URL that other devices will use to connect to the server is http://187.68.1.7:80

When the user connects to the server, you should see a message like:<br>
> Sending response to the user [187.68.1.5]...<br>
> GET / 304 6.276 ms - -<br>
> GET /assets/css/main.css 304 1.764 ms - -<br>
> GET /assets/js/jquery.min.js 304 0.714 ms - -<br>
> GET /assets/js/jszip.min.js 304 0.776 ms - -<br>
> GET /assets/js/FileSaver.min.js 304 0.625 ms - -<br>
> GET /assets/js/main.js 304 0.820 ms - -<br>
> Sending data to new user<br>

It means that all the necessary files are sent to the user.

When transport is finished, you will get a transport message that looks like this:
> Transfer [Lzqqep_StiHXAfY6AAAM -> Jj0Uzo1Xo5SRbqJPAAAK] (22/5/2021, 11:48:46:96)[~1459 ms] completed!!

This message shows the ids of the users and the "->" indicates the direction of transfer. After that, you have the date and time when transport is finished and at the end, you have approximately how much time did it take to transfer all files in milliseconds.
