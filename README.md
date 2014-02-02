WorkMarket
==========

Work Market is a very simple client-server application which distributes work among clients.
There is a single server (aka market), which keeps track of enqueued jobs.
You can start a client (aka worker) on any computer and point it to the server,
so that the client knows where to look for a job.
A single worker performs jobs one by one, so you can adjust the load on a client
by running more workers.
The server assigns a first unassigned job to the worker.

A single job can be almost anything, as long as it is a `*.tar.gz` file with
a `doit.sh` file in it.
You submit a job to the server using `add_work.js --path work.tar.gz`.
You can use `--host 127.0.0.1` and `--port 8801` to specify the server location.

A client is spawned using `worker.js --host IP --port P` and it will
continuously check if the server is running and has a job for the client.
Needless to say, since `doit.sh` can do anything, you must definitely trust
the server and anyone who can add jobs to it.
Authentication/authorization is not currently implemented, so use at your own risk.

You create a server using `server.js --port P`.

As you see the scripts are written in javascript, so you need Node.js to run them.
You must perform `npm install` to download and install all dependencies of this project.

You need `tar` and `bash` on the worker machine to be available.
You can specify location to your bash using `--bash` parameter, which is usefull if you
run the client on Cygiwn (which I personally do).
(Please note, that you do not need "Cygiwn Node.js", just a regular Windows Node.js).

If you want to run multiple workers on the same machine, consider using `--tmp dirname`
to specify separate temporary directories for separate instances of worker,
to avoid any potential race conditions.

As said before a job can be any (compressed) tarball, so you can distribute
the input data for the doit.sh along with it.
The result of your computation should be a single file named `output`.
Obviously you can use `tar` to pack multiple files into a single `output` file.
This file is sent to the server when the job is completed and stored at the server.

Another way to distribute input data and output data is to do it "out of band" -
for example I used pendrive to transfer several GB of input data to all my
clients, and then made my `doit.sh` to only contain the particular input file name, 
and `output` to contain only the location at which the result can be found.
This way the role of the server and network communication was limited to just 
schedulling work.

Schedulling (or lack of it)
===========================

And "schedulling" is really a too large word here: the clients opt-in to the
computation and ask for work themselves, so there is no "schedulling" here.
Workers can be added or removed whenever needed, and the server does not care to know them.

This is a design choice aimed at "fault tolerance", but this subject
is not yet addressed in any way. I have plans to add support to the server
to detect jobs which were assigned long time ago but havent been completed,
and to reassign them.
Currently the only way to do it is to restart the server, 
as the server scans it's `work` and `result` directories at the startup,
and creates todo list as the difference of the two.
