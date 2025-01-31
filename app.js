if(process.env.NODE_ENV !="production"){

    require('dotenv').config();
}


console.log(process.env.SECRET); 

const express=require("express");
const app=express();
const mongoose=require("mongoose");
const Listing=require("./models/listing.js");
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const ExpressError=require("./utils/ExpressError.js");
const wrapAsync=require("./utils/wrapAsync.js");

const listingRouter=require("./routes/listing.js");
const reviewRouter=require("./routes/review.js");
const userRouter=require("./routes/user.js");

const session=require("express-session");
const MongoStore=require("connect-mongo");
const flash=require("connect-flash");
const passport=require("passport") ;
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");




const dbUrl=process.env.ATLASDB_URL;




main()
.then(()=>{
    console.log("connected to db");
})
.catch((err)=>{
    console.log(err);
});
async function main(){
    await mongoose.connect(dbUrl);
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));
app.use("/init", express.static(path.join(__dirname, "init")));


//sessions
const store=MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter:24*3600,
});

store.on("error",()=>{
    console.log("ERROR in MONGO SESSION STORE",err);
});
const sesssionOptions={
    secret:"mysupersecretstring",
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires: Date.now()+7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true,
    },
};



app.use(session(sesssionOptions));
app.use(flash());
 
//Configuring strategy middlewares 
 app.use(passport.initialize());
 app.use(passport.session());
 passport.use(new LocalStrategy(User.authenticate()));
 passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    // req.flash("success", "Your message here");

    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    // res.locals.errorMsg= req.flash("error");
    // console.log( res.locals.success);
    next();
});

// app.get("/demouser",async (req,res)=>{
//     let fakeUser= new User({
//         email:"student@gmail.com",
//         username:"delta-student",
//     });
//     let registeredUser=await User.register(fakeUser,"helloworld");
//     res.send(registeredUser);
// });

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);


// app.get("/",(req,res)=>{
//     res.send("Hi,I am root!");
// });


//Index route
// app.get("/listings",wrapAsync( async (req,res)=>{
//     const allListings=await Listing.find({});
//     res.render("listings/index.ejs",{allListings});
// }));

//New Route
// app.get("/listings/new",(req,res)=>{
//     res.render("listings/new.ejs");
// });


//show route
// app.get("/listings/:id",wrapAsync( async (req,res)=>{

//     const {id}=req.params;
//     try{
//     const listing =await Listing.findById(id).populate("reviews");
//        res.render("listings/show.ejs",{listing});
//     }catch(err){
//         console.log(err);
//         res.status(400).send("Invalid Listing ID");
//     }
// }));

//create route
// app.post("/listings",
//     wrapAsync (async (req,res,next)=>{
//       let result= listingSchema.validate(req.body);
//     console.log(result);
//     if(result.error){
//         throw new ExpressError(400,result.error);
//     }
//     const newListing=new Listing(req.body.listing);
    
//     await newListing.save();
//     res.redirect("/listings");
  
//         })
    
// );

//edit route
// app.get("/listings/:id/edit", wrapAsync (async (req,res)=>{
//     let {id}=req.params;
//     const listing =await Listing.findById(id);
//     res.render("listings/edit.ejs",{listing});
// }));
//update route
// app.put("/listings/:id",wrapAsync( async (req,res)=>{
//     let {id}=req.params;
//    await  Listing.findByIdAndUpdate(id,{...req.body.listing});
//    res.redirect(`/listings/${id}`);
// }));

//delete route
// app.delete("/listings/:id",wrapAsync( async (req,res)=>{
//     let {id}=req.params;
//     let deletedListing= await Listing.findByIdAndDelete(id);
//     console.log(deletedListing);
//     res.redirect("/listings");
// }));

//listings router

//Reviews
// //POST route
// app.post("/listings/:id/reviews",validateReview ,wrapAsync( async(req,res)=>{
//    let listing=await Listing.findById(req.params.id);
//     let newReview = new Review(req.body.review);

//     listing.reviews.push(newReview);

//     await newReview.save();   
//     await listing.save();

//     res.redirect(`/listings/${listing._id}`);
// }));

//review delete rooute
// app.delete(
//     "/listings/:id/reviews/:reviewId" , 
//     wrapAsync( async (req,res)=>{
//         let{ id, reviewId}=req.params;

//         await Listing.findByIdAndUpdate(id,{$pull: {reviews:reviewId}});
//         await Review.findByIdAndDelete(reviewId);
//         res.redirect(`/listings/${id}`);
//     })
// );

// app.get("/testlisting",async (req,res)=>{
//     let sampleListing=new Listing({
//         title:"My new House",
//         description:"By the beach",
//         price:1200,
//         location:"Calangute,Goa",
//         country:"India",
//     });
//    await sampleListing.save();
//    console.log("sample was saved");
//    res.send("successful testing");
// });

app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page Not found"));
});

app.use((err,req,res,next)=>{
    let {statusCode=500,message="Something went wrong"}=err;
    res.status(statusCode).render("listings/error.ejs",{message});
    // res.status(statusCode).send(message);
    // res.send("something went wrong");
});

app.listen(8080,()=>{
    console.log("Server is listening to port 8080 ");
});    