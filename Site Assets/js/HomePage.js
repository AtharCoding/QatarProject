"use strict";
var _siteUrl = "";
var _listNews = "News";
var _listEvents = "Events";
var _listAboutExplore = "AboutExplore";
var _newsCollection = [];
var _eventsCollection = [];
var _allPublications = [];
var _AboutExploreItemColl = [];

var _publicationCounter=0;
var _publicationContentArr=[];
var _alreadyBindCountPublication=0;
var _publicationLoadMoreCount=2;
var _totalPublicationCount=0;

var _blogCounter=0;
var _blogContentArr=[];
var _alreadyBindCountBlog=0;
var _blogLoadMoreCount=2;
var _totalBlogCount=0;

var _newsCounter=0;
var _newsContentArr=[];
var _alreadyBindCountNews=0;
var _newsLoadMoreCount=2;
var _totalNewsCount=0;

$(document).ready(function () {
	document.title = "CENTER FOR CONFLICT AND HUMANITARIAN STUDIES";
	_siteUrl = _spPageContextInfo.webAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', indexStart);
});

function indexStart() {
	
	var urlForLatestEvents = _siteUrl + "/_api/web/lists/GetByTitle('" + _listEvents + "')/items?$top=3&$orderby=Created desc";
	var get_LatestEvents = SPRestCommon.GetItemAjaxCall(urlForLatestEvents);

	var urlAboutExplore = _siteUrl + "/_api/web/lists/GetByTitle('"+_listAboutExplore+"')/items?$top=3&$orderby=Modified desc";
    var get_AboutExplore = SPRestCommon.GetItemAjaxCall(urlAboutExplore);

	$.when(get_LatestEvents,get_AboutExplore)
    .then(function (respLatestEvents,respAboutExplore) {
		//Events Section Start
		try {
			$("#linkAllEvents").attr("href",_siteUrl+"/Pages/Events.aspx");
			_eventsCollection = respLatestEvents[0].d.results;
			for (let i = 0; i < _eventsCollection.length; i++) {
				let eachEvent = _eventsCollection[i];
				let Month = eachEvent.EventStartDate.split('-')[1];
				Month = GetMonthName(Month);
				let Day = eachEvent.EventStartDate.split('-')[2].split('T')[0];
				var eachEventContent = "<div class='event-item'>" +
											"<div class='item-date'>" +	
												"<p class='day'>"+Day+"</p>" +	
												"<p class='month'>"+Month+"</p>" +	
											"</div>"+
											"<a href='" + _siteUrl + "/Pages/EventDetails.aspx?ItemID=" + eachEvent.ID + "'>" +
											"<h5>" + SlicingTitle(eachEvent.Title) + "</h5>" +
											"</a>" +
										"</div>";
				$("#EventsSection").append(eachEventContent);
			}
		} catch (error) {
			console.error(error);
		}
		//Events Section End

		// Explore more about CHS Section Start
		_AboutExploreItemColl = respAboutExplore[0].d.results;
		var aboutMoreSection="";
		for (var i = 0; i < _AboutExploreItemColl.length; i++) {
			if(i==3){
				break;
			}
			var LinkToPageMoreURL=_AboutExploreItemColl[i].LinkToPage!=null?_AboutExploreItemColl[i].LinkToPage.Url:"";
			aboutMoreSection+="<div class='col-lg-4'>";
			aboutMoreSection+="<div class='more-about'>";
			aboutMoreSection+="<a href="+LinkToPageMoreURL+" target='_blank'><img src='"+_AboutExploreItemColl[i].Photo.Url+"' alt='...''><h4>"+_AboutExploreItemColl[i].Title+"</h4></a>";
			aboutMoreSection+="</div></div>";
		}
	
		$("#aboutMoreSection").append(aboutMoreSection);
		// Explore more about CHS Section End 

		//Partner Section Start
		$("#ViewAllPartner").attr("href",_siteUrl+"/Pages/PartnerShips.aspx");
		bindPartnerData();
		//Partner Section End

	}).fail(CommonUtil.OnRESTError);

	bindPublication();
	bindBlog();
	bindNews();
}
function GetMonthName(monthNumber) {
	var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	return months[monthNumber - 1];
}

function bindPartnerData(){
	var context = new SP.ClientContext.get_current();
	var web = context.get_web();
	var PartnerList = web.get_lists().getByTitle("BusinessPartner");
			
	var camlQuery = new SP.CamlQuery();
    camlQuery.set_viewXml(
                          "<View><Query>" +
                          "<OrderBy><FieldRef Name='Created' Ascending='FALSE'/></OrderBy>"+
                          "</Query></View>");	
	var PartnerListListItems = PartnerList.getItems(camlQuery);
	context.load(PartnerListListItems);
	context.executeQueryAsync(
		function(){
			var Partnerenum = PartnerListListItems.getEnumerator();
			var innerData = "";
		
			while(Partnerenum.moveNext()){
				
				var currentItem = Partnerenum.get_current();
				var ID = currentItem.get_item("ID");
				var Title = currentItem.get_item("Title")==undefined?"":currentItem.get_item("Title");
				var ImageUrl = currentItem.get_item("ImageUrl")==undefined?"":getImageSrcValue(currentItem.get_item("ImageUrl"));
				var BusinessPartnerDesc = currentItem.get_item("BusinessPartnerDesc")==undefined?"":currentItem.get_item("BusinessPartnerDesc");
				innerData = innerData+  "<img class='d-none d-lg-inline-block' src="+ImageUrl+" />";
			}
			
			$("#PartnerSection").append(innerData);
		},
		function(){
			console.log('error');
		}
	);
}

function bindPublication(){

	let allPublicationUrl=_siteUrl+"/Pages/Publication.aspx";
	$("#allPublicationAnchor").attr("href",allPublicationUrl);

	let ctx = SP.ClientContext.get_current();
	let list = ctx.get_web().get_lists().getByTitle(_listTitlePublication);
	let camlQuery = new SP.CamlQuery();
	let query = "<View><Query><OrderBy><FieldRef Name='IsFeatured1' Ascending='False'/><FieldRef Name='Modified' Ascending='False'/></OrderBy>";
	query += "</Query></View>";
	camlQuery.set_viewXml(query);

	let items = list.getItems(camlQuery);
	ctx.load(items);
	ctx.executeQueryAsync(function(){
		_totalPublicationCount=items.get_count();
		for(let i=0;i<_totalPublicationCount;i++){
			let eachPublication = items.getItemAtIndex(i);

			let pubAuthIDsArr=[];
			var pubAuthorIDs = eachPublication.get_item('PublicationAuthorIDs');
			for(let j = 0;j < pubAuthorIDs.length;j++) {
				pubAuthIDsArr.push(pubAuthorIDs[j].get_lookupId());
			}
			if(pubAuthIDsArr.length>0){
				let tempObj={};
				tempObj.Index=i;
				tempObj.eachPublication=eachPublication;
				getStaffByIDArray(ctx,pubAuthIDsArr,tempObj,function(staffCollection, tempObj){
					_publicationCounter++;
					if(staffCollection.length>0){
						tempObj.staffCollection=staffCollection;
						fillPublicationDetails(tempObj);
					}
					if(_publicationCounter==_totalPublicationCount)
						bindPublicationHtml();
				},function(err){
					console.error(err);
				});
			}
		}

		if(_totalPublicationCount>_publicationLoadMoreCount)
			$("#publicationReadMore").show();
		else
			$("#publicationReadMore").hide();		

	},function(err){
		console.error(err);
	});

	$("#publicationReadMore").on("click",function(){
		bindPublicationHtml();
	});
}

function fillPublicationDetails(tempObj){

	let eachPublication=tempObj.eachPublication;

	let publicationDetailUrl=_siteUrl+"/Pages/PublicationDetails.aspx?ItemID="+eachPublication.get_item('ID');
	let pubDetails=$("<div></div>").append(eachPublication.get_item('PublicationDetails'));
	let pubTitle=SlicingTitle(eachPublication.get_item('Title'));
	let pubCategory=eachPublication.get_item('PublicationTopicIDs').get_lookupValue();
	let pubImageUrl=getImageSrcValue(eachPublication.get_fieldValues()['ImageUrl']);

	let staffCollection=tempObj.staffCollection;

	let contentHtml="";
	if(tempObj.Index==0){
	 	contentHtml="<div class='col-lg-8'>"+
						"<a href='"+publicationDetailUrl+"'>"+
							"<div class='publication publication-big'>"+
								"<div class='publication-content'>"+
									"<p class='publication-category'>"+pubCategory+"</p>"+
									"<h3 class='publication-title'>"+pubTitle+"</h3>"+
									"<p class='publication-text'>"+SlicingDesc($(pubDetails).text())+"</p>"+
									"<div class='publication-author'>"+
										"<img src='"+staffCollection[0].ProfileImageUrl+"' alt='...'>"+
										"<span>by "+staffCollection[0].Title+"</span>"+
									"</div>"+
								"</div>"+
								"<div class='publication-img'>"+
									"<img src='"+pubImageUrl+"' alt='...'>"+
								"</div>"+
							"</div>"+
						"</a>"+
					"</div>";
	}
	else{
		 contentHtml="<div class='col-lg-4'>"+
						"<a href='"+publicationDetailUrl+"'>"+
							"<div class='publication'>"+
								"<div class='publication-content'>"+
									"<p class='publication-category'>"+pubCategory+"</p>"+
									"<h3 class='publication-title'>"+pubTitle+"</h3>"+
									"<p class='publication-text'>"+SlicingDesc($(pubDetails).text())+"</p>"+
									"<div class='publication-author'>"+
										"<img src='"+staffCollection[0].ProfileImageUrl+"' alt='...'>"+
										"<span>by "+staffCollection[0].Title+"</span>"+
									"</div>"+
								"</div>"+
							"</div>"+
						"</a>"+
					"</div>";
	}
	let contentObj={};
	contentObj.Index=tempObj.Index;
	contentObj.Content=contentHtml;
	_publicationContentArr.push(contentObj);
}

function bindPublicationHtml(){
	let oldBindCountValue=_alreadyBindCountPublication;
	let newBindLimit=oldBindCountValue+_publicationLoadMoreCount;
	let sortByIndex=_publicationContentArr.sort(function(a,b) {
						return a.Index - b.Index;
						});
	for(let i=oldBindCountValue;i<sortByIndex.length;i++){
		if(i==newBindLimit)
			break;
		_alreadyBindCountPublication++;
		$("#publicationSection").append(sortByIndex[i].Content);
	}

	if(sortByIndex.length>_alreadyBindCountPublication)
			$("#publicationReadMore").show();
		else
			$("#publicationReadMore").hide();
}

function bindBlog(){

	let allBlogUrl=_siteUrl+"/Pages/Blogs.aspx";
	$("#allBlogAnchor").attr("href",allBlogUrl);

	let ctx = SP.ClientContext.get_current();
	let list = ctx.get_web().get_lists().getByTitle(_listTitleBlogs);
	let camlQuery = new SP.CamlQuery();
	let query = "<View><Query><OrderBy><FieldRef Name='IsFeatured1' Ascending='False'/><FieldRef Name='Modified' Ascending='False'/></OrderBy>";
	query += "<Where><Eq><FieldRef Name='BlogType' />";
	query += "<Value Type='Text'>Blog</Value>";
	query += "</Eq></Where>";
	query += "</Query></View>";
	camlQuery.set_viewXml(query);

	let items = list.getItems(camlQuery);
	ctx.load(items);
	ctx.executeQueryAsync(function(){
		_totalBlogCount=items.get_count();
		for(let i=0;i<_totalBlogCount;i++){
			let eachBlog = items.getItemAtIndex(i);

			let pubAuthIDsArr=[];
			var pubAuthorIDs = eachBlog.get_item('ContentWriterName');
			for(let j = 0;j < pubAuthorIDs.length;j++) {
				pubAuthIDsArr.push(pubAuthorIDs[j].get_lookupId());
			}
			if(pubAuthIDsArr.length>0){
				let tempObj={};
				tempObj.Index=i;
				tempObj.eachBlog=eachBlog;
				getStaffByIDArray(ctx,pubAuthIDsArr,tempObj,function(staffCollection, tempObj){
					_blogCounter++;
					if(staffCollection.length>0){
						tempObj.staffCollection=staffCollection;
						fillBlogDetails(tempObj);
					}
					if(_blogCounter==_totalBlogCount)
						bindBlogHtml();
				},function(err){
					console.error(err);
				});
			}
		}

		if(_totalBlogCount>_blogLoadMoreCount)
			$("#blogReadMore").show();
		else
			$("#blogReadMore").hide();		

	},function(err){
		console.error(err);
	});

	$("#blogReadMore").on("click",function(){
		bindBlogHtml();
	});
}

function fillBlogDetails(tempObj){

	let eachBlog=tempObj.eachBlog;

	let blogDetailUrl=_siteUrl+"/Pages/BlogDetails.aspx?ItemID="+eachBlog.get_item('ID');
	let pubDetails=$("<div></div>").append(eachBlog.get_item('BlogContent'));
	let pubTitle=SlicingTitle(eachBlog.get_item('Title'));
	
	let blogDate="";
	let contentDate=eachBlog.get_item('ContentDate');
	if(contentDate)
		blogDate=getFormattedDate(contentDate);

	let pubImageUrl=getImageSrcValue(eachBlog.get_fieldValues()['ImageUrl']);

	let staffCollection=tempObj.staffCollection;
	let	contentHtml="<div class='col-lg-4'>"+
							"<a href='"+blogDetailUrl+"'>"+
								"<div class='card'>"+
									"<div class='card-img'>"+
										"<img src='"+pubImageUrl+"' alt='...'>"+
										"<span class='card-date'>"+blogDate+"</span>"+
									"</div>"+
									"<div class='card-body'>"+
										"<h5 class='card-title'>"+pubTitle+"</h5>"+
										"<p class='card-text'>"+SlicingDesc($(pubDetails).text())+"</p>"+
									"</div>"+
									"<div class='card-footer'>"+
										"<p>by "+staffCollection[0].Title+"</p>"+
									"</div>"+
								"</div>"+
							"</a>"+
						"</div>";
	let contentObj={};
	contentObj.Index=tempObj.Index;
	contentObj.Content=contentHtml;
	_blogContentArr.push(contentObj);
}

function bindBlogHtml(){
	let oldBindCountValue=_alreadyBindCountBlog;
	let newBindLimit=oldBindCountValue+_blogLoadMoreCount;
	let sortByIndex=_blogContentArr.sort(function(a,b) {
						return a.Index - b.Index;
						});
	for(let i=oldBindCountValue;i<sortByIndex.length;i++){
		if(i==newBindLimit)
			break;
		_alreadyBindCountBlog++;
		$("#blogSection").append(sortByIndex[i].Content);
	}

	if(sortByIndex.length>_alreadyBindCountBlog)
			$("#blogReadMore").show();
		else
			$("#blogReadMore").hide();
}

function bindNews(){
	let allNewsUrl=_siteUrl+"/Pages/News.aspx";
	$("#allNewsAnchor").attr("href",allNewsUrl);

	let ctx = SP.ClientContext.get_current();
	let list = ctx.get_web().get_lists().getByTitle(_listTitleNews);
	let camlQuery = new SP.CamlQuery();
	let query = "<View><Query><OrderBy><FieldRef Name='IsFeatured1' Ascending='False'/><FieldRef Name='Modified' Ascending='False'/></OrderBy>";
	query += "</Query></View>";
	camlQuery.set_viewXml(query);

	let items = list.getItems(camlQuery);
	ctx.load(items);
	ctx.executeQueryAsync(function(){
		_totalNewsCount=items.get_count();
		for(let i=0;i<_totalNewsCount;i++){
			let eachNews = items.getItemAtIndex(i);
			let tempObj={};
			tempObj.eachNews=eachNews;
			tempObj.Index=i;
			fillNewsDetails(tempObj);
		}
		bindNewsHtml();
		if(_totalNewsCount>_newsLoadMoreCount)
			$("#newsReadMore").show();
		else
			$("#newsReadMore").hide();		

	},function(err){
		console.error(err);
	});
	$("#newsReadMore").on("click",function(){
		bindNewsHtml();
	});
}

function fillNewsDetails(tempObj){

	let eachNews=tempObj.eachNews;

	let newsDetailUrl=_siteUrl+"/Pages/NewsDetails.aspx?ItemID="+eachNews.get_item('ID');
	let newsDetails=$("<div></div>").append(eachNews.get_item('NewsContent'));
	let newsTitle=SlicingTitle(eachNews.get_item('Title'));
	
	let newsDate="";
	let contentDate=eachNews.get_item('NewsDate');
	if(contentDate)
		newsDate=getFormattedDate(contentDate);

	let pubImageUrl=getImageSrcValue(eachNews.get_fieldValues()['ImageUrl']);

	let contentHtml="";
	if(tempObj.Index==0)
		contentHtml="<div class='col-lg-8 d-none d-lg-block'>"+
						"<a href='"+newsDetailUrl+"'>"+
							"<div class='latest'>"+
								"<div class='latest-img'>"+
									"<img src='"+pubImageUrl+"' />"+
								"</div>"+
								"<div class='latest-content'>"+
									"<p class='latest-date'>"+newsDate+"</p>"+
									"<h3 class='latest-title'>"+newsTitle+"</h3>"+
									"<p class='latest-desc'>"+SlicingDesc($(newsDetails).text())+"</p>"+
								"</div>"+
							"</div>"+
						"</a>"+
					"</div>";
	else
		contentHtml="<div class='col-lg-4'>"+
						"<div class='card'>"+
							"<a href='"+newsDetailUrl+"'>"+
								"<div class='card-img'>"+
									"<img src='"+pubImageUrl+"' alt='...'>"+
									"<span class='card-date'>"+newsDate+"</span>"+
								"</div>"+
								"<div class='card-body'>"+
									"<h5 class='card-title'>"+newsTitle+"</h5>"+
									"<p class='card-text'>"+SlicingDesc($(newsDetails).text())+"</p>"+
								"</div>"+
							"</a>"+
						"</div>"+
					"</div>";
	let contentObj={};
	contentObj.Index=tempObj.Index;
	contentObj.Content=contentHtml;
	_newsContentArr.push(contentObj);
}

function bindNewsHtml(){
	let oldBindCountValue=_alreadyBindCountNews;
	let newBindLimit=oldBindCountValue+_newsLoadMoreCount;
	let sortByIndex=_newsContentArr.sort(function(a,b) {
						return a.Index - b.Index;
						});
	for(let i=oldBindCountValue;i<sortByIndex.length;i++){
		if(i==newBindLimit)
			break;
		_alreadyBindCountNews++;
		$("#NewsContentsection").append(sortByIndex[i].Content);
	}

	if(sortByIndex.length>_alreadyBindCountNews)
			$("#newsReadMore").show();
		else
			$("#newsReadMore").hide();
}
