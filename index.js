import express from "express";
import bodyParser from "body-parser";
import { getDate } from "./date.js";
import mongoose from "mongoose";
import _ from "lodash";
const PORT = process.env.PORT || 3000;
const app = express();
const day = getDate();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
	"mongodb+srv://yuvrajachrekar:Yuvraj123@cluster0.dqaakp0.mongodb.net/toDoListDB?retryWrites=true&w=majority"
);

const itemsSchema = new mongoose.Schema({
	name: String,
});

const listSchema = new mongoose.Schema({
	name: String,
	item: [itemsSchema],
});

const Item = mongoose.model("Item", itemsSchema);

const List = mongoose.model("list", listSchema);

const item = [
	{
		name: "Welcome to TODO List",
	},
	{
		name: "Hit + to add new item",
	},
	{
		name: "Check the item to delete",
	},
];

app.get("/", async function (req, res) {
	const response = await Item.find();
	if (response.length === 0) {
		Item.insertMany(item).then(() => {
			console.log("Successfully inserted");
		});
		res.redirect("/");
	} else {
		res.render("list", { listTitle: day, newItem: response });
	}
});

app.get("/:customListName", async function (req, res) {
	if (req.params.customListName != "favicon.ico") {
		const customListTitle = _.capitalize(req.params.customListName);
		try {
			const response = await List.findOne({ name: customListTitle }).exec();
			if (response === null) {
				//Create a new list
				const list = new List({
					name: customListTitle,
					item: item,
				});
				list.save();
				res.redirect("/" + customListTitle);
			} else {
				//Show Existing List
				res.render("list", {
					listTitle: response.name,
					newItem: response.item,
				});
			}
		} catch (error) {
			console.log(error);
		}
	}
});

app.post("/", function (req, res) {
	const itemName = req.body.newItem;
	const listName = req.body.button;
	const item = new Item({
		name: itemName,
	});

	if (listName === day) {
		item.save();
		res.redirect("/");
	} else {
		List.findOne({ name: listName })
			.then(function (foundList) {
				foundList.item.push(item);
				foundList.save();
				res.redirect("/" + listName);
			})
			.catch((err) => {
				console.log(err);
			});
	}
});

app.post("/delete", function (req, res) {
	const checkedItemId = req.body.checkbox;
	const listName = req.body.listName;

	if (listName === day) {
		Item.findByIdAndRemove(checkedItemId)
			.then(function () {
				console.log("Successfully Deleted");
				res.redirect("/");
			})
			.catch(function (err) {
				console.log(err);
			});
	} else {
		List.findOneAndUpdate(
			{ name: listName },
			{ $pull: { item: { _id: checkedItemId } } }
		)
			.then((foundList) => {
				res.redirect("/" + listName);
			})
			.catch((err) => {
				console.log(err);
			});
	}
});

app.listen(PORT, function () {
	console.log(`server is running on port ${PORT}`);
});
