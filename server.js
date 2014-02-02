var port = 8801;
var express = require('express');
var url = require('url');
var _ = require('underscore');
var fs = require('fs');
var app = express();
app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser({ keepExtensions: true, uploadDir: './tmp_upload' }));

var works = [];

var old_works = fs.readdirSync('work');
var old_results = fs.readdirSync('result');
_.each(old_works,function(old_work){
  var match=old_work.match(/d+/);
  if(match){
    var id=m[0];
    works[id]={
      'id':id,
      'state':'todo',
      'path':'work/' + old_work,
      'createdAt': Date.now(),
    }
  }
});
_.each(old_results,function(old_result){
  var match=old_result.match(/d+/);
  if(match){
    var id=m[0];
    if(0<=id && id < works.length){
      works[id].state = 'done';
      works[id].result_path = 'result/' + old_result;
      works[id].finishedAt = Date.now();
    }
  }
});



app.param('work_id',function(req,res,next,work_id){
  if(work_id<0 || works.length<=work_id){
    res.status(404).json("No such work");
  }else{
    req.work = works[work_id];
    next();
  }
});

app.get('/',function(req,res){
  res.type('text/html');
  fs.readFile('template.jst', function (err, data) {
    if(err){
      res.json("Error: could not load template");
    }else{
      res.send(_.template(data.toString(),{works:works},{variable:'d'}));
    }
  });
});
app.get('/watch_work/:work_id',function(req,res){
  res.type('application/json');
  res.json(req.work);
});
app.get('/download_work/:work_id',function(req,res){
  res.sendfile(req.work.path);
});
app.get('/download_result/:work_id',function(req,res){
  if(req.work.status == "done"){
    res.sendfile(req.work.result_path);
  }else{
    res.status(403).json("The work status is " + req.work.status + " so you can not see results");
  }
});
app.get('/give_me_work',function(req,res){
  var work = _.find(works,function(work){
    return work.status=="todo";
  });
  if(work){
    work.status = "assigned";
    work.assignedAt = Date.now();
    res.json(work);
  }else{
    res.json(null);
  }
});

app.post('/solved/:work_id',function(req,res){
  res.type('application/json');
  var work = req.work;
  if(work.status == "uploading"){
    res.status(403).json("This job is being uploaded at the moment. Please retry in 60 seconds.");
  }else if(work.status == "done"){
    res.status(403).json("This job is already done, thank you.");
  }else if(work.status == "assigned"){
    var params = url.parse(req.url,true).query;
    var uploaded_file_info = req.files.result;
    work.status = 'uploading';
    fs.readFile(uploaded_file_info.path, function (err, data) {
      if(err){
          work.status = "assigned";
          res.json("Error: could not read uploaded file");

      }else{
        work.result_path = './result/' + work.id;
        fs.writeFile(work.result_path, data, function (err) {
          if(err){
            work.status = "assigned";
            res.json("Error: could not move file");
          }else{
            work.status = "done";
            work.finishedAt = Date.now();
            res.json(work);
          }
        });
      }
    });
  }else{
    res.status(403).json("Current status of the work is " + work.status + " so you can not upload it.");
  }

});


app.post('/add_work',function(req,res){
  res.type('application/json');
  var params = url.parse(req.url,true).query;
  var uploaded_file_info = req.files.work;
  var id = works.length;
  var work = {
    id: id,
    path: "./work/" + id,
    status: "todo",
    createdAt : Date.now(),
  };
  works.push(work);
  fs.readFile(uploaded_file_info.path, function (err, data) {
    if(err){
        res.json("Error: could not read uploaded file");
    }else{
      fs.writeFile(work.path, data, function (err) {
        if(err){
          res.json("Error: could not move file");
        }else{
          res.json(work);
          console.log("Enqueued work #" + work.id);
        }
      });
    }
  });
});
app.listen(port);
console.log("Listening on port " + port);
