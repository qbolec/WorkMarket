#!/usr/bin/env node
var argv = require('optimist').argv;
var restler = require('restler');
var fs = require('fs');
var file_path = argv.path;

var options = {
  host: argv.host || '127.0.0.1',
  port: +(argv.port || 80),
  path: '/add_work',
  method: 'POST'
};

if(/\.tar\.gz$/.test(file_path)){
  fs.stat(file_path, function(err, stats) {
    if(err){
      console.log("Error when preforming stat on " + file_path);
      console.log(err);
    }else{
      var url = 'http://' + options.host + ':' + options.port +  options.path;
      restler.post(url, {
        multipart: true,
        data: {
          "work": restler.file(file_path, null, stats.size)
        }
      }).on("success", function(data) {
        console.log(data);
      }).on("fail", function(data,response){
        console.log("Failed request to " + url);
        console.log(data);
        console.log(response);
      }).on("error",function(err,response){
        console.log("Error when performing request to " + url);
        console.log(err);
        console.log(response);
      });
    }
  });
}else{
  console.log("The work file must be *.tar.gz and contain doit.sh");
}
