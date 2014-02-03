#!/usr/bin/env node
var argv = require('optimist').argv;
var _ = require('underscore');
var restler = require('restler');
var fs = require('fs');
var file_path = argv.path;
var exec = require('child_process').exec;
var options = {
  host: argv.host || '127.0.0.1',
  port: +(argv.port || 80),
  tmp : argv.tmp || 'tmp',
  bash : argv.bash || 'bash.exe', //so.. tar, mkdir, rm etc work fine, but ./doit.sh will not
  method: 'POST'
};

var base_url = 'http://' + options.host + ':' + options.port;

function report_result(work,retry_all){
  var file_path = options.tmp +'/work-' + work.id + '/output';
  fs.stat(file_path, function(err, stats) {
    if(err){
      console.log("Error when preforming stat on " + file_path);
      console.log(err);
      retry_all();
    }else{
      var url = base_url + '/solved/' + work.id;
      restler.post(url, {
        multipart: true,
        data: {
          "result": restler.file(file_path, null, stats.size)
        }
      }).on("success", function(data) {
        console.log("Reported success!");
        console.log(data);
        loop();
      }).on("fail", function(data,response){
        console.log("Failed request to " + url);
        console.log(data);
        console.log(response);
        retry_all();
      }).on("error",function(err,response){
        console.log("Error when performing request to " + url);
        console.log(err);
        console.log(response);
        retry_all();
      });
    }
  });
}

function do_work(work,retry_all){
  var dir = options.tmp +'/work-' + work.id;
  exec('cd ' + dir + ' && ' + options.bash + ' -c "./doit.sh"', function (error, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    if(error){
      console.log("Could not perform work in " + dir);
      console.log(error);
      retry_all();
    }else{
      console.log("Work done:)");
      report_result(work,retry_all);
    }
  });
}

function decompress_work(work,filename,retry_all){
  var dir = 'work-' + work.id;
  exec('cd ' + options.tmp + ' && rm -f ' + dir + ' && mkdir '+dir+' && tar --strip-components=1 -C '+dir+' -zxvf ' + filename, function (error, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    if(error){
      console.log("Could not decompress work to dir " + dir);
      console.log(error);
      retry_all();
    }else{
      console.log("Decompressed work!");
      do_work(work,retry_all);
    }
  });
}

function download_work(work,retry_all){
  var url = base_url + '/download_work/' + work.id;
  var retry = function(){_.delay(function(){download_work(work,retry_all)},1000);};
  restler.get(url,{

  }).on('success',function(data,response){
    var filename = 'work-' + work.id +  '.tar.gz';
    var path =  options.tmp + '/' + filename;
    fs.writeFile(path, response.raw, 'binary', function (err) {
      if(err){
        console.log("Error: could not save work file " + path);
        retry();
      }else{
        console.log("Saved file with work as " + path);
        decompress_work(work,filename,retry_all);
      }
    });

  }).on("fail", function(data,response){
    console.log("Failed request to " + url);
    console.log(data);
    console.log(response);
    retry_all();
  }).on("error",function(err,response){
    console.log("Error when performing request to " + url);
    console.log(err);
    console.log(response);
    retry();
  });
}

function loop(){
  var url = base_url + '/give_me_work';
  var retry = function(){_.delay(loop,1000);};
  restler.get(url,{

  }).on('success',function(work){
    console.log(work);
    if(work === null){
      console.log("nothing to do ..");
      retry();
    }else{
      download_work(work,retry);
    }
  }).on("fail", function(data,response){
    console.log("Failed request to " + url);
    console.log(data);
    console.log(response);
    retry();
  }).on("error",function(err,response){
    console.log("Error when performing request to " + url);
    console.log(err);
    console.log(response);
    retry();
  });
}

loop();
