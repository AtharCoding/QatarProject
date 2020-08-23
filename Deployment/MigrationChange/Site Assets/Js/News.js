"use strict";
var _siteUrl = "";

var ctx;
var newsList;
var newsCamlQuery;
var listItems;
var itemLimit=5;
var newsCollections={
	RetrieveResultsets:[],
	MainResultSet:[],
	NextResultPosition:0,
	StartIndex:0,
	EndIndex:0	
};
var isRefreshData=false;

$(document).ready(function () {
	document.title = "News";
	_siteUrl =_spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', newsStart);
});

function newsStart() {
	getListDetails(_listTitleNews);
	bindNewsData("");
	bindLoadMoreEvent();

	//For sharing site
	let metaTitle="News";
	let metaDesc="Motife News";
	let metaImageUrl=_spPageContextInfo.webLogoUrl;
	$("head").append("<meta property='og:title' content='"+metaTitle+"'>");
	$("head").append("<meta property='og:description' content='"+metaDesc+"'>");
	$("head").append("<meta property='og:image' content='"+metaImageUrl+"'>");
	$("head").append("<meta name='twitter:card' content='"+metaDesc+"'>");
}

function bindNewsData(whereQuery){
	if(isRefreshData)
		$("#newsContent").html("");

	newsCollections.RetrieveResultsets=[];
	newsCollections.MainResultSet=[];
	newsCollections.NextResultPosition="";
	newsCollections.StartIndex=0;
	newsCollections.EndIndex=0;

	ctx = SP.ClientContext.get_current();
	newsList = ctx.get_site().get_rootWeb().get_lists().getByTitle(_listTitleNews);
	newsCamlQuery = new SP.CamlQuery();
	let query = "<View><Query><OrderBy><FieldRef Name='IsFeatured1' Ascending='False' /><FieldRef Name='Modified' Ascending='False'/></OrderBy>";
	if(whereQuery)
		query += whereQuery;
	query += "</Query><RowLimit>"+itemLimit+"</RowLimit></View>";
	newsCamlQuery.set_viewXml(query);
	listItems = newsList.getItems(newsCamlQuery);
	ctx.load(listItems);
	ctx.executeQueryAsync(function(){
		newsCollections.StartIndex=0;
		newsCollections.EndIndex=listItems.get_count();
		newsCollections.NextResultPosition=listItems.get_listItemCollectionPosition();
		loadMoreHideShow();
		fillNewsItems();
	},failure);
}

function fillNewsItems() {
	for (let i = 0; i < listItems.get_count(); i++) {
		let tempObj = {};
		let eachNews = listItems.getItemAtIndex(i);
		tempObj.Index = i;
		tempObj.ID = eachNews.get_item('ID');
		if(isArabic){
			tempObj.Title = SlicingTitle(eachNews.get_item('NewsArabicTitle'));
			tempObj.NewsDetails =SlicingDesc($("<div></div>").append(eachNews.get_item('NewsArabicDesc')).text());
		}
		else{
			tempObj.Title =SlicingTitle(eachNews.get_item('Title'));
			tempObj.NewsDetails =SlicingDesc($("<div></div>").append(eachNews.get_item('NewsContent')).text());
		}
		let newsDateStr = eachNews.get_item('NewsDate');
		if (newsDateStr)
			tempObj.NewsDate = getFormattedDate(newsDateStr);

		let imgStr = eachNews.get_fieldValues()['ImageUrl'];
		if (imgStr)
			tempObj.ImageUrl = getImageSrcValue(imgStr);

		newsCollections.RetrieveResultsets.push(tempObj);
		newsCollections.RetrieveResultsets.sort(function (a, b) { return a.Index - b.Index; });
		let mainLength = newsCollections.MainResultSet.length;
		if (mainLength > 0) {
			$.each(newsCollections.RetrieveResultsets, function () {
				this.Index = mainLength + this.Index;
			});
		}
		newsCollections.MainResultSet = newsCollections.MainResultSet.concat(newsCollections.RetrieveResultsets);
		newsCollections.RetrieveResultsets = [];
	}
	fillNewsHtml(newsCollections.MainResultSet, newsCollections.StartIndex, newsCollections.EndIndex);
	loadMoreHideShow();
}

function fillNewsHtml(resultSet,startIndex,endIndex){
	for (let i = startIndex; i < endIndex; i++) {
		let eachNews = resultSet[i];

		let newsDetailUrl = isArabic?_siteUrl + "/ar/pages/NewsDetails.aspx?ItemID=" + eachNews.ID:_siteUrl + "/Pages/NewsDetails.aspx?ItemID=" + eachNews.ID;;
		let newsDetails = eachNews.NewsDetails;
		let newsTitle = eachNews.Title;
		let newsImageUrl = eachNews.ImageUrl;
		let newsDate=eachNews.NewsDate;

		if(i==0){
			$("#firstNewsDetailLink").attr("href",newsDetailUrl);
			$("#firstNewsImg").attr("src",newsImageUrl);
			$("#firstNewsDate").text(newsDate);
			$("#firstNewsTitle").text(newsTitle);
			$("#firstNewsDesc").text(newsDetails);
		}
		else{
			let	contentHtml="<div class='col-lg-4'>"+
								"<a href='"+newsDetailUrl+"'>"+
									"<div class='card'>"+
										"<div class='row'>"+
											"<div class='col-5 pr-xs-0 col-lg-12'>"+
												"<div class='card-img'>"+
													"<img src='"+newsImageUrl+"' alt='...'>"+
													"<span class='card-date d-none d-lg-block'>"+newsDate+"</span>"+
												"</div>"+
											"</div>"+
											"<div class='col-7 col-lg-12'>"+
												"<div class='card-body'>"+
													"<span class='card-date d-block d-lg-none'>"+newsDate+"</span>"+
													"<h5 class='card-title'>"+newsTitle+"</h5>"+
													"<p class='card-text d-none d-lg-block'>"+newsDetails+"</p>"+
												"</div>"+
											"</div>"+
										"</div>"+
									"</div>"+
								"</a>"+
							"</div>";
			$("#newsContent").append(contentHtml);
		}
	}
}

function bindLoadMoreEvent(){
	$("#newsLoadMore").on("click",function(){
		isRefreshData=false;
		if (newsCollections.NextResultPosition != null) {
			newsCamlQuery.set_listItemCollectionPosition(newsCollections.NextResultPosition);
			listItems = newsList.getItems(newsCamlQuery);
			ctx.load(listItems);
			//Call the same function recursively until all the items in the current criteria are fetched.
			ctx.executeQueryAsync(function(){
				newsCollections.NextResultPosition=listItems.get_listItemCollectionPosition();
				newsCollections.StartIndex=newsCollections.EndIndex;
				newsCollections.EndIndex=newsCollections.StartIndex+listItems.get_count();
				fillNewsItems();
			}, failure);
		}
	});
}
function loadMoreHideShow(){
	if(newsCollections.NextResultPosition==null || newsCollections.MainResultSet.length==0)
		$("#newsLoadMore").hide();
	else
		$("#newsLoadMore").show();
}

function failure(err){
console.log(err);
}