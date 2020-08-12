"use strict";
var _siteUrl = "";

var _newsCollection = [];
var _eventsCollection = [];
var _allPublications = [];
var _AboutExploreItemColl = [];

var _publicationCounter=0;
var _publicationContentArr=[];
var _alreadyBindCountPublication=0;
var _publicationLoadMoreCount=3;
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

var SliderCollections=[];
var commonUrl="";

$(document).ready(function () {
	document.title = "Home";
	_siteUrl = _spPageContextInfo.siteAbsoluteUrl;
	commonUrl=_siteUrl+(isArabic?"/ar/pages/":"/Pages/");
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', indexStart);
});

function indexStart() {
	bindHeadertext();
	var today = new  Date();
	var urlForLatestEvents = _siteUrl + "/_api/web/lists/GetByTitle('" + _listTitleEvents + "')/items?$top=3&$filter=EventStartDate ge '" + today.toISOString() + "'&$orderby=Created desc";
	var get_LatestEvents = SPRestCommon.GetItemAjaxCall(urlForLatestEvents);

	$.when(get_LatestEvents,getDataforSlider(_listTitleNews),getDataforSlider(_listTitlePublication),getDataforSlider(_listTitleBlogs),getDataforSlider(_listTitleResearch))
    .then(function (respLatestEvents,respNewsSlider,respPublicationSlider,respBlogsSlider,respResearchThemeSlider) {
		
		try {
			ProcessNewsSlider(respNewsSlider);
			ProcessPublicationSlider(respPublicationSlider);
			ProcessBlogSlider(respBlogsSlider);
			ProcessResearchSlider(respResearchThemeSlider);

			if(SliderCollections.length>0){
				BindSlider();
			}
			if(respLatestEvents[0].d.results.length>0){
				BindEvents(respLatestEvents[0].d.results);
			}
			try {
				bindPartnerData();
			}
			catch (error) {
				console.error(error);
			}
		}
		catch (error) {
			console.error(error);
		}
	
	}).fail(CommonUtil.OnRESTError);

	bindSmallbanner();
	bindExtraContent();
	bindPublication();
	bindBlog();
	bindNews();
	bindHomeExplore();
	setupLanguage();
}

function BindSlider()
{
	var OuterSlider="";
			var SliderData="";
			var SliderNavigation="";
			var SliderIndicators="";
			
			SliderData=SliderData+"<div class='carousel-inner'>";
			for(var i=0; i<SliderCollections.length; i++){
				if(i==4)
					break;
				let activeClass="";
				if(i==0)
					activeClass="active";
				SliderData=SliderData+"<div class='carousel-item "+activeClass+"'>"+
											"<div class='carousel-overlay'></div>"+
											"<img src='"+SliderCollections[i].ImageUrl+"?Width=1350&Height=600' class='d-block w-100' alt='...'>"+
											"<div class='carousel-caption'>"+
													"<div class='container'>"+
														"<p class='category'>"+SliderCollections[i].Category+"</p>"+
														"<h2>"+SliderCollections[i].Title+"</h2>"+
														"<a href="+SliderCollections[i].MoreLink+" class='btn btn-primary go-button'>FIND OUR MORE</span></a>"+
													"</div>"+
											"</div>"+
										"</div>";
			}
			SliderData=SliderData+"</div>";
			
			SliderData=SliderData+"<a class='carousel-control-prev d-none d-lg-flex' href='#slider' role='button' data-slide='prev'>"+
							"<i class='fal fa-chevron-left'></i>"+
								"<span class='sr-only'>Previous</span>"+
							"</a>"+
							"<a class='carousel-control-next d-none d-lg-flex' href='#slider' role='button' data-slide='next'>"+
								"<i class='fal fa-chevron-right'></i>"+
								"<span class='sr-only'>Next</span>"+
							"</a>";
			SliderNavigation=SliderNavigation+"<div class='slider-navigation d-none d-lg-block'>"+
												"<div class='container'>"+
													"<div class='row grid-flex'>";

			for(var i=0; i<SliderCollections.length; i++){
				if(i==4){
					break;
				}
				if(i==0){
					SliderNavigation=SliderNavigation+"<div class='col-lg-3'>"+
														"<h3 data-target='#slider' class='active' data-slide-to='"+i+"'>"+SliderCollections[i].Title+"</h3>"+
													  "</div>";
				}
				else{
					SliderNavigation=SliderNavigation+"<div class='col-lg-3'>"+
														"<h3 data-target='#slider' data-slide-to='"+i+"'>"+SliderCollections[i].Title+"</h3>"+
													  "</div>";
				}
			}
			SliderNavigation=SliderNavigation+"</div></div></div>";
			
			
			SliderIndicators=SliderIndicators+"<div class='slider-mobile-dots d-block d-lg-none'>"+
												"<ol class='carousel-indicators'>";
			for(var i=0; i<SliderCollections.length; i++){
				if(i==4){
					break;
				}
				if(i==0){
					SliderIndicators=SliderIndicators+"<li data-target='#carouselExampleIndicators' data-slide-to='"+i+"' class='active'></li>";
				}
				else{
					SliderIndicators=SliderIndicators+"<li data-target='#carouselExampleIndicators' data-slide-to='"+i+"'></li>";
				}
			}
			SliderIndicators=SliderIndicators+"</ol></div>";

			OuterSlider=SliderData+SliderNavigation+SliderIndicators;
			$("#slider").append(OuterSlider);
}
function BindEvents(eventsCollection){
	try {
		$("#linkAllEvents").attr("href",commonUrl+"Events.aspx");
		_eventsCollection = eventsCollection;
		for (let i = 0; i < _eventsCollection.length; i++) {
			let eachEvent = _eventsCollection[i];
			let Month = eachEvent.EventStartDate.split('-')[1];
			Month = GetMonthName(Month);
			let Day = eachEvent.EventStartDate.split('-')[2].split('T')[0];
			let eventTitle=isArabic?SlicingTitle(eachEvent.EventArabicTitle):SlicingTitle(eachEvent.Title);
			var eachEventContent = "<div class='event-item'>" +
										"<div class='item-date'>" +	
											"<p class='day'>"+Day+"</p>" +	
											"<p class='month'>"+Month+"</p>" +	
										"</div>"+
										"<a href='" + commonUrl + "EventDetails.aspx?ItemID=" + eachEvent.ID + "'>" +
										"<h5>" + eventTitle + "</h5>" +
										"</a>" +
									"</div>";
			$("#EventsSection").append(eachEventContent);
		}
	} catch (error) {
		console.error(error);
	}
}
function ProcessNewsSlider(respNewsSlider){
	var respNewsSliderEnum = respNewsSlider.getEnumerator();
	while(respNewsSliderEnum.moveNext()){
		var newCurrentItem = respNewsSliderEnum.get_current();
		var NewsID = newCurrentItem.get_item("ID");
		var ImageUrl = newCurrentItem.get_item("ImageUrl")==undefined?"":getImageSrcValue(newCurrentItem.get_item("ImageUrl"));
		var Title="";
		if(newCurrentItem.get_item("Title")!=undefined){
			Title= isArabic ? SlicingTitle(newCurrentItem.get_item("NewsArabicTitle")): SlicingTitle( newCurrentItem.get_item("Title"));
		}
		let MoreLink="";
		MoreLink = commonUrl+"NewsDetails.aspx?ItemID="+NewsID;
		SliderCollections.push(
			{
			 'ImageUrl': ImageUrl,
			 'Category': isArabic?'أخبار':'News',
			 'Title'   :Title,
			 'MoreLink':MoreLink
			}
		)
	}
}
function ProcessPublicationSlider(respPublicationSlider){
	var respPublicationSliderEnum = respPublicationSlider.getEnumerator();
	while(respPublicationSliderEnum.moveNext()){
		var publicationCurrentItem = respPublicationSliderEnum.get_current();
		var publicationID = publicationCurrentItem.get_item("ID");
		var ImageUrl = publicationCurrentItem.get_item("ImageUrl")==undefined?"":getImageSrcValue(publicationCurrentItem.get_item("ImageUrl"));
		var Title="";
		if(publicationCurrentItem.get_item("Title")!=undefined){
			Title= isArabic ? SlicingTitle(publicationCurrentItem.get_item("PublicationArabicTitle")): SlicingTitle( publicationCurrentItem.get_item("Title"));
		}
		let MoreLink="";
		MoreLink = commonUrl+ "PublicationDetails.aspx?ItemID="+publicationID;
		SliderCollections.push(
			{
			 'ImageUrl': ImageUrl,
			 'Category': isArabic?'المنشورات':'Publications',
			 'Title'   :Title,
			 'MoreLink':MoreLink
			}
		)
	}
}
function ProcessBlogSlider(respBlogsSlider){
	var respBlogsSliderEnum = respBlogsSlider.getEnumerator();
			while(respBlogsSliderEnum.moveNext()){
				var blogsCurrentItem = respBlogsSliderEnum.get_current();
				var blogID = blogsCurrentItem.get_item("ID");
				var ImageUrl = blogsCurrentItem.get_item("ImageUrl")==undefined?"":getImageSrcValue(blogsCurrentItem.get_item("ImageUrl"));
				var Title="";
				if(blogsCurrentItem.get_item("Title")!=undefined){
					Title= isArabic ? SlicingTitle(blogsCurrentItem.get_item("BlogArabicTitle")): SlicingTitle( blogsCurrentItem.get_item("Title"));
				}
				let MoreLink="";
				MoreLink = commonUrl+ "BlogDetails.aspx?ItemID="+blogID
				SliderCollections.push(
					{
					 'ImageUrl': ImageUrl,
					 'Category': isArabic?'المدونات':'Blogs',
					 'Title'   :Title,
					 'MoreLink':MoreLink
					}
				)
			}
}
function ProcessResearchSlider(respResearchThemeSlider){
	var respResearchThemeSliderEnum = respResearchThemeSlider.getEnumerator();
	while(respResearchThemeSliderEnum.moveNext()){
		var ResearchCurrentItem = respResearchThemeSliderEnum.get_current();
		var researchID = ResearchCurrentItem.get_item("ID");
		var ImageUrl = ResearchCurrentItem.get_item("ImageUrl")==undefined?"":getImageSrcValue(ResearchCurrentItem.get_item("ImageUrl"));
		var Title="";
		if(ResearchCurrentItem.get_item("Title")!=undefined){
			Title= isArabic ? SlicingTitle(ResearchCurrentItem.get_item("ResearchArabicTitle")): SlicingTitle( ResearchCurrentItem.get_item("Title"));
		}
		let MoreLink="";
		MoreLink = commonUrl+ "ResearchDetails.aspx?ItemID="+researchID;
		SliderCollections.push(
			{
			 'ImageUrl': ImageUrl,
			 'Category': isArabic?'ابحاث':'Research',
			 'Title'   :Title,
			 'MoreLink':MoreLink
			}
		)
	}
}
function GetMonthName(monthNumber) {
	var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	return months[monthNumber - 1];
}

function bindPartnerData(){

	var context = new SP.ClientContext.get_current();
	var web = context.get_site().get_rootWeb();
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
				// var ID = currentItem.get_item("ID");
				// var Title="";
				// var BusinessPartnerDesc="";
				// if(currentItem.get_item("Title")!=undefined){
				// 	Title= isArabic ? SlicingTitle(currentItem.get_item("ArabicBusinessTitle")): SlicingTitle( currentItem.get_item("Title"));
				// }
				// if(currentItem.get_item("BusinessPartnerDesc")!=undefined){
				// 	BusinessPartnerDesc= isArabic ? SlicingDesc(currentItem.get_item("ArabicBusinessDesc")): SlicingDesc( currentItem.get_item("BusinessPartnerDesc"));
				// }
				
				var ImageUrl = currentItem.get_item("ImageUrl")==undefined?"":getImageSrcValue(currentItem.get_item("ImageUrl"));
				innerData = innerData+  "<img class='d-none d-lg-inline-block' src="+ImageUrl+" />";
			}
			if(isArabic){
				$("#ViewAllPartner").attr("href",commonUrl+"PartnerShips.aspx");
			}
			else{
				$("#ViewAllPartner").attr("href",commonUrl+"PartnerShips.aspx");
			}
			
			$("#PartnerSection").append(innerData);
		},failure);
}

function bindPublication(){

	let allPublicationUrl=commonUrl+"Publication.aspx";
	$("#allPublicationAnchor").attr("href",allPublicationUrl);

	let ctx = SP.ClientContext.get_current();
	let list = ctx.get_site().get_rootWeb().get_lists().getByTitle(_listTitlePublication);
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
				getStaffDetailsByQuery(createCamlQueryByIDArr(pubAuthIDsArr),tempObj,function(staffCollection, tempObj){
					_publicationCounter++;
					if(staffCollection.length>0){
						tempObj.staffCollection=staffCollection;
						fillPublicationDetails(tempObj);
					}
					if(_publicationCounter==_totalPublicationCount)
						bindPublicationHtml(2);
				},failure);
			}
		}

		if(_totalPublicationCount>_publicationLoadMoreCount)
			$("#publicationReadMore").show();
		else
			$("#publicationReadMore").hide();		

	},failure);

	$("#publicationReadMore").on("click",function(){
		bindPublicationHtml(3);
	});
}

function fillPublicationDetails(tempObj){

	let eachPublication=tempObj.eachPublication;

	let publicationDetailUrl=commonUrl+"PublicationDetails.aspx?ItemID="+eachPublication.get_item('ID');
	let pubDetails=isArabic?eachPublication.get_item('PublicationArabicDetails'):eachPublication.get_item('PublicationDetails');
	pubDetails=SlicingDesc($("<div></div>").append(pubDetails).text());
	let pubTitle=isArabic?SlicingTitle(eachPublication.get_item('PublicationArabicTitle')):SlicingTitle(eachPublication.get_item('Title'));
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
									"<p class='publication-text'>"+pubDetails+"</p>"+
									"<div class='publication-author'>"+
										"<img src='"+staffCollection[0].ImageUrl+"' alt='...'>"+
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
									"<p class='publication-text'>"+pubDetails+"</p>"+
									"<div class='publication-author'>"+
										"<img src='"+staffCollection[0].ImageUrl+"' alt='...'>"+
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

function bindPublicationHtml(pubItemsLimit){
	let oldBindCountValue=_alreadyBindCountPublication;
	let newBindLimit=oldBindCountValue+pubItemsLimit;//_publicationLoadMoreCount;
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

	let allBlogUrl=commonUrl+"Blogs.aspx";
	$("#allBlogAnchor").attr("href",allBlogUrl);

	let ctx = SP.ClientContext.get_current();
	let list = ctx.get_site().get_rootWeb().get_lists().getByTitle(_listTitleBlogs);
	let camlQuery = new SP.CamlQuery();
	let query = "<View><Query><OrderBy><FieldRef Name='IsFeatured1' Ascending='False'/><FieldRef Name='Modified' Ascending='False'/></OrderBy>";
	query += "<Where><Eq><FieldRef Name='BlogTypeLookup' />";
	query += "<Value Type='lookup'>Blog</Value>";
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
				getStaffDetailsByQuery(createCamlQueryByIDArr(pubAuthIDsArr),tempObj,function(staffCollection, tempObj){
					_blogCounter++;
					if(staffCollection.length>0){
						tempObj.staffCollection=staffCollection;
						fillBlogDetails(tempObj);
					}
					if(_blogCounter==_totalBlogCount)
						bindBlogHtml(2);
				},failure);
			}
		}

		if(_totalBlogCount>_blogLoadMoreCount)
			$("#blogReadMore").show();
		else
			$("#blogReadMore").hide();		

	},failure);

	$("#blogReadMore").on("click",function(){
		bindBlogHtml(3);
	});
}

function fillBlogDetails(tempObj){

	let eachBlog=tempObj.eachBlog;

	let blogDetailUrl=commonUrl+"BlogDetails.aspx?ItemID="+eachBlog.get_item('ID');

	let blogTitleStr=isArabic?eachBlog.get_item('BlogArabicTitle'):eachBlog.get_item('Title');
	let blogTitle=SlicingTitle(blogTitleStr);

	let blogDetails=isArabic?eachBlog.get_item('BlogContentArabic'):eachBlog.get_item('BlogContent');
	blogDetails=SlicingDesc($("<div></div>").append(blogDetails).text());
	let blogDate="";
	let contentDate=eachBlog.get_item('ContentDate');
	if(contentDate)
		blogDate=getFormattedDate(contentDate);

	let pubImageUrl=getImageSrcValue(eachBlog.get_fieldValues()['ImageUrl']);

	let videoHtml=eachBlog.get_item('IsVideo')?"<button type='button' class='open-video-right'><i class='fas fa-caret-right' aria-hidden='true'></i></button>":"";

	let staffCollection=tempObj.staffCollection;
	let	contentHtml="<div class='col-lg-4'>"+
							"<a href='"+blogDetailUrl+"'>"+
								"<div class='card'>"+
									"<div class='card-img'>"+
										"<img src='"+pubImageUrl+"' alt='...'>"+videoHtml+
										"<span class='card-date'>"+blogDate+"</span>"+
									"</div>"+
									"<div class='card-body'>"+
										"<h5 class='card-title'>"+blogTitle+"</h5>"+
										"<p class='card-text'>"+blogDetails+"</p>"+
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

function bindBlogHtml(blogItemLimit){
	let oldBindCountValue=_alreadyBindCountBlog;
	let newBindLimit=oldBindCountValue+blogItemLimit;//_blogLoadMoreCount;
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
	let allNewsUrl=commonUrl+"News.aspx";
	$("#allNewsAnchor").attr("href",allNewsUrl);

	let ctx = SP.ClientContext.get_current();
	let list = ctx.get_site().get_rootWeb().get_lists().getByTitle(_listTitleNews);
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

	},failure);
	$("#newsReadMore").on("click",function(){
		bindNewsHtml();
	});
}

function fillNewsDetails(tempObj){

	let eachNews=tempObj.eachNews;

	let newsDetailUrl=commonUrl+"NewsDetails.aspx?ItemID="+eachNews.get_item('ID');
	let newsDetails=$("<div></div>").append(isArabic?eachNews.get_item('NewsArabicDesc'):eachNews.get_item('NewsContent'));
	newsDetails=SlicingDesc($(newsDetails).text());
	let newsTitle=SlicingTitle(isArabic?eachNews.get_item('NewsArabicTitle'):eachNews.get_item('Title'));
	
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
									"<img src='"+pubImageUrl+"?width=580&height=340' />"+
								"</div>"+
								"<div class='latest-content'>"+
									"<p class='latest-date'>"+newsDate+"</p>"+
									"<h3 class='latest-title'>"+newsTitle+"</h3>"+
									"<p class='latest-desc'>"+newsDetails+"</p>"+
								"</div>"+
							"</div>"+
						"</a>"+
					"</div>";
	else
		contentHtml="<div class='col-lg-4'>"+
						"<div class='card'>"+
							"<a href='"+newsDetailUrl+"'>"+
								"<div class='card-img'>"+
									"<img src='"+pubImageUrl+"?width=580&height=340' alt='...'>"+
									"<span class='card-date'>"+newsDate+"</span>"+
								"</div>"+
								"<div class='card-body'>"+
									"<h5 class='card-title'>"+newsTitle+"</h5>"+
									"<p class='card-text'>"+newsDetails+"</p>"+
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

let _aboutExploreData=[];
function bindHomeExplore(){
	let ctx = SP.ClientContext.get_current();
	let list = ctx.get_site().get_rootWeb().get_lists().getByTitle(_listTitleAboutExplore);
	let camlQuery = new SP.CamlQuery();
	let query = "<View><Query><OrderBy><FieldRef Name='IsFeatured1' Ascending='False'/><FieldRef Name='Modified' Ascending='False'/></OrderBy>";
	query += "</Query><RowLimit>3</RowLimit></View>";
	camlQuery.set_viewXml(query);
	let items = list.getItems(camlQuery);
	ctx.load(items);
	ctx.executeQueryAsync(function(){
		let itemsCount=items.get_count();
		for(let i=0;i<itemsCount;i++){
			let eachItem = items.getItemAtIndex(i);
			let tempObj={};
			tempObj.eachItem=eachItem;
			tempObj.Index=i;
			fillAboutExploreDetails(tempObj);
		}
		bindAboutExploreHtml();
	},failure);
}

function fillAboutExploreDetails(tempObj){
	let eachItem=tempObj.eachItem;

	let title=isArabic?eachItem.get_item("AboutExploreArabicTitle"):eachItem.get_item("Title");
	let exploreUrl=isArabic?eachItem.get_item("AboutExploreArabicCLinkToPage"):eachItem.get_item("AboutExploreLinkToPage");
	if(exploreUrl)
		exploreUrl=exploreUrl.get_url();
	let itemImgUrl=getImageSrcValue(eachItem.get_fieldValues()['ImageUrl']);
	let contentHtml="<div class='col-lg-4'>"+
						"<div class='more-about'>"+
							"<a href="+exploreUrl+" >"+
								"<img src='"+itemImgUrl+"?Width=380&Height=250' alt='...''>"+
								"<h4>"+title+"</h4>"+
							"</a>"+
						"</div>"+
					"</div>";
	let contentObj={};
	contentObj.Index=tempObj.Index;
	contentObj.Content=contentHtml;
	_aboutExploreData.push(contentObj);
}

function bindAboutExploreHtml(){
	let sortByIndex=_aboutExploreData.sort(function(a,b) {
						return a.Index - b.Index;
						});
	for(let i=0;i<sortByIndex.length;i++){
		$("#aboutMoreSection").append(sortByIndex[i].Content);
	}
}

function bindSmallbanner(){
	var context = new SP.ClientContext.get_current();
	var web = context.get_site().get_rootWeb();
	var smallBannerList = web.get_lists().getByTitle(_listTitleHomeSmallBanner);
	let camlQuery = new SP.CamlQuery();
	let query = "<View><Query><OrderBy><FieldRef Name='IsFeatured1' Ascending='False'/><FieldRef Name='Modified' Ascending='False'/></OrderBy>";
	query += "<Where><Eq><FieldRef Name='IsFeatured1' />";
	query += "<Value Type='Boolean'>1</Value>";
	query += "</Eq></Where>";
	query += "</Query><RowLimit>2</RowLimit></View>";
	camlQuery.set_viewXml(query);
		
	var smallBannerListItems = smallBannerList.getItems(camlQuery);
	context.load(smallBannerListItems);
	context.executeQueryAsync(
		function(){
			var smallBannerenum = smallBannerListItems.getEnumerator();
			var innerData = "";
		
			while(smallBannerenum.moveNext()){
				
				var currentItem = smallBannerenum.get_current();
				var Title="";
				if(currentItem.get_item("Title")!=undefined){
					Title= isArabic ? SlicingTitle(currentItem.get_item("HomeBanerArabicTitle")): SlicingTitle( currentItem.get_item("Title"));
				}
				var ImageUrl = currentItem.get_item("ImageUrl")==undefined?"":getImageSrcValue(currentItem.get_item("ImageUrl"));
				innerData = innerData+"<div>"+
											"<div class='headeline'>"+
											"<img src='"+ImageUrl+"' />"+
											"<h4>"+Title+"</h4>"+
											"</div>"+
									   "</div>";
			}
			$("#SmallBannerHeading").append(innerData);
			
		},failure);
}

function bindExtraContent(){
	var context = new SP.ClientContext.get_current();
	var web = context.get_site().get_rootWeb();
	var extraContentList = web.get_lists().getByTitle(_listTitleHomeExtraContent);
			
	var camlQuery = new SP.CamlQuery();
    camlQuery.set_viewXml("<View><RowLimit>1</RowLimit></View>");	
	var extraContentListItems = extraContentList.getItems(camlQuery);
	context.load(extraContentListItems);
	context.executeQueryAsync(
		function(){
			var extraContentenum = extraContentListItems.getEnumerator();
			var innerData = "";
			$("#MoreAboutUS").hide();
			while(extraContentenum.moveNext()){
				
				var currentItem = extraContentenum.get_current();
				var ID = currentItem.get_item("ID");
				var HomeExtraLogo = currentItem.get_item("HomeExtraLogo0")==undefined?"":getImageSrcValue(currentItem.get_item("HomeExtraLogo0"));
				var Title="";
				var HomeExtraContentDesc="";
				if(currentItem.get_item("Title")!=undefined){
					Title= isArabic ? SlicingTitle(currentItem.get_item("ArabicExtraContentTitle")): SlicingTitle( currentItem.get_item("Title"));
				}
				if(currentItem.get_item("HomeExtraContentDesc")!=undefined){
					HomeExtraContentDesc= isArabic ? SlicingDesc(currentItem.get_item("HomeExtraContentArabicDesc")): SlicingDesc( currentItem.get_item("HomeExtraContentDesc"));
				}
			
				var ImageUrl = currentItem.get_item("ImageUrl")==undefined?"":getImageSrcValue(currentItem.get_item("ImageUrl"));
				var VideoThumbnail = currentItem.get_item("VideoThumbnail")==undefined?"":currentItem.get_item("VideoThumbnail").get_url();
				var MoreAboutUsLink = "";
				MoreAboutUsLink = commonUrl+"About.aspx";
				$("#HomeExtraTitle").text(Title);
				$("#HomeExtraContentDesc").text(HomeExtraContentDesc);
				$("#HomeExtraLogo").attr("src", HomeExtraLogo);
				$("#HomeExtraVideo").attr("src", ImageUrl);
				$("#HomeExtraVideoCover").attr("src", ImageUrl);
				$("#VideoPath").attr("src", VideoThumbnail);
				$("#MoreAboutUS").show();
				$("#MoreAboutUS").text(isArabic?"المزيد عنا":"MORE ABOUT US");
				$("#MoreAboutUS").attr("href",MoreAboutUsLink);
				
			}
			
			
		},failure);
}

function getDataforSlider(listName) {
	var dfd = $.Deferred(function(){
	var context = new SP.ClientContext.get_current();
	var web = context.get_site().get_rootWeb();
	var ListName = web.get_lists().getByTitle(listName);
	var camlQuery = new SP.CamlQuery();
	camlQuery.set_viewXml(
		"<View><Query>" +
		"<Where>" +
				"<Eq><FieldRef Name=\"IsShowOnHome\"/><Value Type=\"Boolean\">1</Value></Eq>" +
		"</Where>" +
		"</Query></View>");	
	var ListNameItems = ListName.getItems(camlQuery);
	
	context.load(ListNameItems);
		context.executeQueryAsync(
			function(){
				dfd.resolve(ListNameItems);
			},
			function(sender,args){
				dfd.reject(args.get_message());
			}
		);
	});
	return dfd.promise();
}

function ToggleVideo()
{
	$("#ImageSection").hide();
	$("#VideSection").show();
}

function bindHeadertext()
{
	if(isArabic){
		$("#txtLatestNews").text("أحدث الأخبار");
		$("#txtEvents").text("الأحداث");
		$("#txtPublication").text("منشورات مختارة");
		$("#txtrecentBlogPosts").text("أحدث التدوينات");
		$("#allBlogAnchor").text("جميع مشاركات المدونة");
		$("#allNewsAnchor").text("جميع الأخبار");
		$("#linkAllEvents").text("كل الأحداث");
		$("#allPublicationAnchor").text("جميع المنشورات");
		$("#txtOurPartners").text("شركاؤنا");
		$("#ViewAllPartner").text("عرض الكل");
		
	}
	else{
		$("#txtLatestNews").text("Latest News");
		$("#txtEvents").text("Events");
		$("#txtPublication").text("Selected Publications");
		$("#txtrecentBlogPosts").text("Recent Blog Posts");
		$("#allBlogAnchor").text("ALL BLOG POSTS");
		$("#allNewsAnchor").text("All News");
		$("#linkAllEvents").text("All Events");
		$("#allPublicationAnchor").text("All Publications");
		$("#txtOurPartners").text("Our Partners");
		$("#ViewAllPartner").text("VIEW ALL");
		
		
	}	
}

function setupLanguage(){
	$("#ExploremoreAbout").text(isArabic?"اكتشف المزيد حول CHS":"Explore more about CHS");
}