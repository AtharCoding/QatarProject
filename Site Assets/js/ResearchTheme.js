"use strict";
var _siteUrl = "";
var ctx;
var researchList;
var researchCamlQuery;
var listItems;
var itemLimit=5;
var researchCollections={
	RetrieveResultsets:[],
	MainResultSet:[],
	NextResultPosition:0,
	StartIndex:0,
	EndIndex:0	
};
var isRefreshData=false;
$(document).ready(function () {
	document.title = "Research Theme";
	_siteUrl = _spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', researchStart);
});


function researchStart() {
	getListDetails(_listTitleResearch);
	bindResearchData("");
	bindLoadMoreEvent();
}

function bindResearchData(whereQuery){
	if(isRefreshData)
		$("#researchContent").html("");

	researchCollections.RetrieveResultsets=[];
	researchCollections.MainResultSet=[];
	researchCollections.NextResultPosition="";
	researchCollections.StartIndex=0;
	researchCollections.EndIndex=0;

	ctx = SP.ClientContext.get_current();
	researchList = ctx.get_site().get_rootWeb().get_lists().getByTitle(_listTitleResearch);
	researchCamlQuery = new SP.CamlQuery();
	let query = "<View><Query><OrderBy><FieldRef Name='IsFeatured1' Ascending='False' /><FieldRef Name='Modified' Ascending='False'/></OrderBy>";
	if(whereQuery)
		query += whereQuery;
	query += "</Query><RowLimit>"+itemLimit+"</RowLimit></View>";
	researchCamlQuery.set_viewXml(query);
	listItems = researchList.getItems(researchCamlQuery);
	ctx.load(listItems);
	ctx.executeQueryAsync(function(){
		researchCollections.StartIndex=0;
		researchCollections.EndIndex=listItems.get_count();
		researchCollections.NextResultPosition=listItems.get_listItemCollectionPosition();
		loadMoreHideShow();
		fillResearchItems();
	},failure);
}

function fillResearchItems() {
	for (let i = 0; i < listItems.get_count(); i++) {
		let tempObj = {};
		let eachResearch = listItems.getItemAtIndex(i);
		tempObj.Index = i;
		tempObj.ID = eachResearch.get_item('ID');
		if(isArabic){
			tempObj.Title = SlicingTitle(eachResearch.get_item('ResearchArabicTitle'));
			tempObj.ResearchDetails =SlicingDesc($("<div></div>").append(eachResearch.get_item('ResearchArabicContent')).text());
			tempObj.learnMore="قراءة المزيد";
		}
		else{
			tempObj.Title =SlicingTitle(eachResearch.get_item('Title'));
			tempObj.ResearchDetails =SlicingDesc($("<div></div>").append(eachResearch.get_item('ResearchContent')).text());
			tempObj.learnMore="Learn MOre";
		}
		let imgStr = eachResearch.get_fieldValues()['ImageUrl'];
		if (imgStr)
			tempObj.ImageUrl = getImageSrcValue(imgStr);

		researchCollections.RetrieveResultsets.push(tempObj);
		researchCollections.RetrieveResultsets.sort(function (a, b) { return a.Index - b.Index; });
		let mainLength = researchCollections.MainResultSet.length;
		if (mainLength > 0) {
			$.each(researchCollections.RetrieveResultsets, function () {
				this.Index = mainLength + this.Index;
			});
		}
		researchCollections.MainResultSet = researchCollections.MainResultSet.concat(researchCollections.RetrieveResultsets);
		researchCollections.RetrieveResultsets = [];
	}
	fillResearchHtml(researchCollections.MainResultSet, researchCollections.StartIndex, researchCollections.EndIndex);
	loadMoreHideShow();
}

function fillResearchHtml(resultSet,startIndex,endIndex){
	for (let i = startIndex; i < endIndex; i++) {
		let eachResearch = resultSet[i];

		let researchDetailUrl = _siteUrl +(isArabic?"/Ar/Pages/":"/Pages/")+ "ResearchDetails.aspx?ItemID=" + eachResearch.ID;
		let researchDetails = eachResearch.ResearchDetails;
		let researchTitle = eachResearch.Title;
		let researchImageUrl = eachResearch.ImageUrl;
		let learnMore=eachResearch.learnMore;

		var eachResearchContent="<a href='"+researchDetailUrl+"'>"+
											"<div class='post-list-item'>"+
												"<div class='row'>"+
													"<div class='col-lg-4'>"+
														"<div class='post-list-item-img'>"+
															"<img src='"+researchImageUrl+"'>"+
														"</div>"+
													"</div>"+
													"<div class='col-lg-8'>"+
														"<div class='post-list-content'>"+
															"<h2>"+researchTitle+"</h2>"+
															"<p>"+researchDetails+"</p>"+
															"<span class='go-link'>"+learnMore+"</span>"+
														"</div>"+
													"</div>"+
												"</div>"+
											"</div>"+
										"</a>";
		$("#researchContent").append(eachResearchContent);
	}
}

function bindLoadMoreEvent(){
	$("#researchLoadMore").on("click",function(){
		isRefreshData=false;
		if (researchCollections.NextResultPosition != null) {
			researchCamlQuery.set_listItemCollectionPosition(researchCollections.NextResultPosition);
			listItems = researchList.getItems(researchCamlQuery);
			ctx.load(listItems);
			//Call the same function recursively until all the items in the current criteria are fetched.
			ctx.executeQueryAsync(function(){
				researchCollections.NextResultPosition=listItems.get_listItemCollectionPosition();
				researchCollections.StartIndex=researchCollections.EndIndex;
				researchCollections.EndIndex=researchCollections.StartIndex+listItems.get_count();
				fillResearchItems();
			}, failure);
		}
	});
}
function loadMoreHideShow(){
	if(researchCollections.NextResultPosition==null || researchCollections.MainResultSet.length==0)
		$("#researchLoadMore").hide();
	else
		$("#researchLoadMore").show();
}

function failure(err){
console.log(err);
}