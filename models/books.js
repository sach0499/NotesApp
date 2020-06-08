var mongoose = require("mongoose");

var bookSchema = new mongoose.Schema({
    title: String,
    description:{type:String,default:"none"},
    createdAt: {type: Date, default: Date.now},
    photos:[],
	author: {
		id:{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
    },
    price:{type:String,default:"free"},
    reviews: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Comment"
	}]
});
module.exports = mongoose.model("Book",bookSchema);