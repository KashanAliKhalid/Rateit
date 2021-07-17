var express= require("express"),
    bodyparser= require("body-parser");
    _=require("underscore");
var Promise = require("bluebird");
var mongoose = Promise.promisifyAll(require("mongoose"));
mongoose.set('useCreateIndex', true); //avoids deprecation warning when using showschemna.index
var app= express();
app.use(express.static("Public")); //to use files from public folder
app.use(bodyparser.urlencoded({extended: true}));
app.set("view engine","ejs");
var showname="";
mongoose.connect("mongodb+srv://kashan:rateit@rateit.fl3km.mongodb.net/Rateit?retryWrites=true&w=majority",{useUnifiedTopology: true,useNewUrlParser: true, });
var showScehma= new mongoose.Schema({
    show: String,
    rating: Number,
    age: Number,
    year: Number,
    country : String,
    comment: Boolean
});
//to handle data duplication
showScehma.index(
    {
        show: 1,
        rating:1,
        age: 1,
        year: 1,
        country : 1,
        comment: 1
    },
    {unique: true}
);
var Show= mongoose.model("Show",showScehma);

app.get("/", function (req,res) {
   res.render("Homepage")

});
app.post("/selectshow",function (req,res) {
showname= req.body.showname;
Show.find({show:showname},function (err, ShowReturn) {
    if(err)
    {
        console.log(err);
    }
    else
    {
        url="/graphs/"+showname;
        res.redirect(url);
    }
});
});


app.get("/selectshow",function (req,res) {
   res.render("Selectshow");
});

app.post("/adminpanel" , function (req, res) {
    var show_name=req.body.showname_admin.toLowerCase();
    var rating_admin= req.body.rating_admin;
    var age_admin = req.body.age_admin;
    var year_admin= req.body.year_admin;
    var comment_admin= req.body.comment_admin.toLowerCase();
    var country_admin= req.body.country_admin.toLowerCase();

    var show_data=
        {
            show: show_name,
            rating: rating_admin,
            age: age_admin,
            year: year_admin,
            country : country_admin,
            comment: comment_admin
    };
    Show.create(show_data,function (err, newentry) {
        if(!err)
        {
            console.log("data entered successfully");
        }
        else
        {
            console.log(err);
        }
    });

    res.redirect("/adminpanel")
});

app.get("/adminpanel" , function (req, res) {
    res.render("adminpanel");

});

app.get("/graphs/:name", function (req,res)
{
    countries=[];
    names=[];
    var ratings=[];
    var countofratings=[];
    var trueage=[];
    var falseage=[];
    var truecount=[];
    var falsecount=[];

    var name=req.params.name.toLowerCase();

        Show.aggregate(
            [
                { $match: { show: name } },
                { $group : { _id: '$country', count : {$sum :1}}}
            ], function (err,result) {
                result.forEach( function (found) {
                    countries.push(found.count);
                    names.push(found._id)
                });
                Show.aggregate(
                    [
                        { $match: { show: name } },
                        { $group : { _id: '$rating', count : {$sum :1}}}
                    ], function (err,result) {
                        result.forEach( function (found) {
                            countofratings.push(found.count);
                            ratings.push(found._id)
                        });
                        Show.aggregate(
                            [
                                { $match: { show: name } },
                                { $group : { _id: {age:'$age' , comment:'$comment'}, count : {$sum :1}}},
                                {$sort: { comment : 1}}
                            ], function (err,result) {
                                result.forEach( function (found)
                                {
                                    console.log(found);
                                    if(found._id.comment === true )
                                    {
                                        truecount.push(found.count);
                                        trueage.push(found._id.age);
                                    }
                                    else
                                    {
                                        falsecount.push(found.count);
                                        falseage.push(found._id.age);
                                    }
                                });
                                var newfalseage=[];
                                falseage.forEach(function (check) {
                                        var index= trueage.indexOf(check);
                                        if(index!==-1)
                                        {
                                            newfalseage[index]=falsecount[falseage.indexOf(check)];
                                        }
                                        else
                                        {
                                            var len=truecount.length;
                                            newfalseage[len]=falsecount[falseage.indexOf(check)];
                                            trueage.push(check);
                                        }
                                }) ;
                                falsecount=newfalseage;
                                res.render("graphs",{countries:countries,names:names , name:name, ratings: ratings, countofratings:countofratings,truecount:truecount, falsecount:falsecount, trueage:trueage});

                            });
                    });
            });
});


app.listen(process.env.PORT,function () {
    console.log("Server is running");
});
