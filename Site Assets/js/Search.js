"use strict";
var _siteUrl = "";
var searchText="";
var CType="";
var CTypeValues={
	Publication:"PublicationCType",
	Blog:"BlogContentType",
	News:"NewsCType"
}
var ctx;
var keywordQuery;
var searchExecutor;
var mySearchResult;
var searchItemLimit=5;
var pubCollections={
	RetrieveResultsets:[],
	MainResultSet:[],
	NextResultPosition:0,
	StartIndex:0,
	EndIndex:0,
	TotalItemsCount:0	
};
var isRefreshData=false;

var filterTypeValues=[];
var filterYearValues=[];

$(document).ready(function () {
	document.title = "Search";
	_siteUrl = _spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);

	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
		SP.SOD.executeFunc("SP.Search.js", "Microsoft.SharePoint.Client.Search.Query.KeywordQuery", searchResultStart);
	});
});

function searchResultStart() {
	const urlParams = new URLSearchParams(window.location.search);
	searchText =decodeURI(urlParams.get('searchText')?urlParams.get('searchText'):urlParams.get('searchtext'));
	CType = decodeURI(urlParams.get('CType')?urlParams.get('CType'):urlParams.get('CType'));

	$("#searchHeading").text(isArabic?"نتائج البحث عن '"+searchText+"'":"Search results for '"+searchText+"'");

	bindSearchData(0);
	bindLoadMoreEvent();
	//setDefaultFilterValues();
	//fillSearchsFilterValues();
	//setupLanguage();
}

function bindSearchData(startIndex){
	if(isRefreshData)
		$("#searchContent").html("");

	ctx = SP.ClientContext.get_current();
	keywordQuery = new Microsoft.SharePoint.Client.Search.Query.KeywordQuery(ctx);
	keywordQuery.set_trimDuplicates(false);
	let queryText="'"+searchText+"'"+(CType=='0'?" AND(ContentType='"+CTypeValues.PublicationCType+"' OR ContentType='"+CTypeValues.Blog+"' OR ContentType='"+CTypeValues.News+"')":" AND ContentType='"+CType+"'");
	keywordQuery.set_queryText(queryText);
	keywordQuery.set_rowLimit(searchItemLimit);
	keywordQuery.set_rowsPerPage(searchItemLimit);
	keywordQuery.set_startRow(startIndex);

	var properties = keywordQuery.get_selectProperties();
	properties.add("ImageUrlOWSIMGE");
	properties.add("NewsImageUrl");
	properties.add("EventImageUrl");
	properties.add("BannerImageUrlOWSURLH");


	properties.add("IsFeatured1OWSBOOL");
	properties.add("ContentType");
	properties.add("ListItemID");

	properties.add("PublicationDateOWSDATE");
	properties.add("PublicationArabicTitleOWSTEXT");
	properties.add("PublicationDetailsOWSMTXT");
	properties.add("PublicationArabicDetailsOWSMTXT");

	properties.add("ContentDateOWSDATE");
	properties.add("BlogArabicTitleOWSTEXT");
	properties.add("BlogContent");
	properties.add("BlogContentArabic");
	
	properties.add("NewsDateOWSDATE");
	properties.add("NewsArabicTitleOWSTEXT");
	properties.add("NewsContent");
	properties.add("NewsArabicDescOWSMTXT");
	
	searchExecutor = new Microsoft.SharePoint.Client.Search.Query.SearchExecutor(ctx);
	mySearchResult = searchExecutor.executeQuery(keywordQuery);

	ctx.executeQueryAsync(
		function () {
			let searchData=mySearchResult.m_value.ResultTables[0];
			let resultItemsTotal=searchData.TotalRows;
			let currentResultData=searchData.ResultRows;
			if(currentResultData.length>0){
				$("#searchCountLabel").text(isArabic?"":"Showing 1-"+(startIndex+currentResultData.length)+" of "+resultItemsTotal+" search results");
				pubCollections.StartIndex=startIndex;
				pubCollections.EndIndex=startIndex+searchData.RowCount;
				pubCollections.TotalItemsCount=searchData.TotalRows;
				fillSearchItems(currentResultData);
			}
			loadMoreHideShow();
	},failure);
}

function fillSearchItems(currentResultData) {
	for (let i = 0; i < currentResultData.length; i++) {
		let tempObj = {};
		let eachSearch = currentResultData[i];
		tempObj.Index = i;
		tempObj.ID = eachSearch.ListItemID;
		tempObj.ContentType = eachSearch.ContentType;
		tempObj.IsFeatured1 = eachSearch.IsFeatured1OWSBOOL;
		tempObj.ImageUrl =eachSearch.ImageUrlOWSIMGE?getImageSrcValue(eachSearch.ImageUrlOWSIMGE):getImageSrcValue(eachSearch.NewsImageUrl);

		if(tempObj.ContentType==CTypeValues.Publication){
			tempObj.searchItemDate=eachSearch.PublicationDateOWSDATE;
			tempObj.searchItemTitle=isArabic?eachSearch.PublicationArabicTitleOWSTEXT:eachSearch.Title;
			tempObj.searchItemDesc=isArabic?eachSearch.PublicationArabicDetailsOWSMTXT:eachSearch.PublicationDetailsOWSMTXT;
			tempObj.searchItemCategory=isArabic?"النشر":"Publication";
			tempObj.searchItemDetailUrl=_siteUrl +(isArabic?"/ar/pages/":"/Pages/")+"PublicationDetails.aspx?ItemID="+tempObj.ID;
		}
		if(tempObj.ContentType==CTypeValues.Blog){
			tempObj.searchItemDate=eachSearch.ContentDateOWSDATE;
			tempObj.searchItemTitle=isArabic?eachSearch.BlogArabicTitleOWSTEXT:eachSearch.Title;
			tempObj.searchItemDesc=isArabic?eachSearch.BlogContentArabic:eachSearch.BlogContent;
			tempObj.searchItemCategory=isArabic?"المدونة":"Blog";
			tempObj.searchItemDetailUrl=_siteUrl +(isArabic?"/ar/pages/":"/Pages/")+"BlogDetails.aspx?ItemID="+tempObj.ID;
		}
		if(tempObj.ContentType==CTypeValues.News){
			tempObj.searchItemDate=eachSearch.NewsDateOWSDATE;
			tempObj.searchItemTitle=isArabic?eachSearch.NewsArabicTitleOWSTEXT:eachSearch.Title;
			tempObj.searchItemDesc=isArabic?eachSearch.NewsArabicDescOWSMTXT:eachSearch.NewsContent;
			tempObj.searchItemCategory=isArabic?"الأخبار":"News";
			tempObj.searchItemDetailUrl=_siteUrl +(isArabic?"/ar/pages/":"/Pages/")+"NewsDetails.aspx?ItemID="+tempObj.ID;
		}

		
		pubCollections.RetrieveResultsets.push(tempObj);
	}
	pubCollections.RetrieveResultsets.sort(function (a, b) { return a.Index - b.Index; });
	let mainLength = pubCollections.MainResultSet.length;
	if (mainLength > 0) {
		$.each(pubCollections.RetrieveResultsets, function () {
			this.Index = mainLength + this.Index;
		});
	}
	pubCollections.MainResultSet = pubCollections.MainResultSet.concat(pubCollections.RetrieveResultsets);
	pubCollections.RetrieveResultsets = [];
	pubCollections.NextResultPosition=pubCollections.MainResultSet.length;
	fillSearchHtml(pubCollections.MainResultSet, pubCollections.StartIndex, pubCollections.EndIndex);
	loadMoreHideShow();
}

function fillSearchHtml(resultSet,startIndex,endIndex){
	for (let i = startIndex; i < endIndex; i++) {
		let eachSearch = resultSet[i];
		
		let searchDetailUrl = eachSearch.searchItemDetailUrl;
		let categoryName=eachSearch.searchItemCategory;
		let searchItemTitle =SlicingTitle(eachSearch.searchItemTitle);
		let itemImageUrl = eachSearch.ImageUrl;
		let searchItemDate=getFormattedDate(eachSearch.searchItemDate);
		let searchItemDesc=SlicingDesc($("<div></div>").append(eachSearch.searchItemDesc).text());

		let itemHtml="<div class='event-list-item'>"+
						"<div class='row'>"+
							"<div class='col-lg-3'>"+
								"<div class='card-img'>"+
									"<a href='"+searchDetailUrl+"' class='event-list-item-img'>"+
										"<img src='"+itemImageUrl+"'>"+
									"</a>"+
									"<span class='card-date'>"+searchItemDate+"</span>"+
								"</div>"+
							"</div>"+
							"<div class='col-lg-7'>"+
								"<div class='event-list-content'>"+
									"<p class='event-category'>"+categoryName+"</p>"+
									"<a href='"+searchDetailUrl+"'>"+
										"<h2>"+searchItemTitle+"</h2>"+
									"</a>"+
									"<p>"+searchItemDesc+"</p>"+
								"</div>"+
							"</div>"+
							"<div class='col-7 col-lg-2'>"+
								"<a href='"+searchDetailUrl+"' class='go-link'>LEARN MORE</a>"+
							"</div>"+
						"</div>"+
					"</div>";
		$("#searchResultDiv").append(itemHtml);
	}
}

function bindLoadMoreEvent(){
	$("#searchLoadMore").on("click",function(){
		isRefreshData=false;
		if (pubCollections.NextResultPosition != null) {
			let newCurrentIndex= pubCollections.NextResultPosition;
			bindSearchData(newCurrentIndex);
		}
	});
}
function loadMoreHideShow(){
	if(pubCollections.TotalItemsCount<=pubCollections.NextResultPosition || pubCollections.MainResultSet.length==0)
		$("#searchLoadMore").hide();
	else
		$("#searchLoadMore").show();
}

function setDefaultFilterValues(){
	$("#ddlSearchYear,#ddlSearchAuthors").selectpicker("destroy");
	$("#ddlSearchYear option,#ddlSearchAuthors option,#searchTypeFilter button").remove();

	$("#searchTypeFilter").append("<button class='btn btn-primary all' type='button'>" + _allTopicFilterValue + "</button>");
	$("#ddlSearchYear").append("<option>" + _allYearFilterValue + "</option>");
	$("#ddlSearchAuthors").append("<option value='"+_allAuthorFilterValue+"'>" +_allAuthorFilterValue + "</option>");

	$("#searchContent").html("");
}
function fillSearchsFilterValues(){
	let newCtx = SP.ClientContext.get_current();

	let newPubList = newCtx.get_site().get_rootWeb().get_lists().getByTitle(_listTitleSearch);
	let newPubCamlQuery = new SP.CamlQuery();
	let query = "<View><Query><OrderBy><FieldRef Name='IsFeatured1' Ascending='False' /><FieldRef Name='Modified' Ascending='False'/></OrderBy>";
	query += "</Query><RowLimit>1000</RowLimit></View>";
	newPubCamlQuery.set_viewXml(query);
	let newListItems = newPubList.getItems(newPubCamlQuery);

	let newPubTopicList = newCtx.get_site().get_rootWeb().get_lists().getByTitle(_listTitleSearchTopics);
	let newPubTopicListItems=newPubTopicList.getItems(SP.CamlQuery.createAllItemsQuery());

	let newPubAuthorList = newCtx.get_site().get_rootWeb().get_lists().getByTitle(_listTitleCommunity);
	let newPubAuthorListItems=newPubAuthorList.getItems(SP.CamlQuery.createAllItemsQuery());
	
	newCtx.load(newListItems);
	newCtx.load(newPubTopicListItems);
	newCtx.load(newPubAuthorListItems);
	
	newCtx.executeQueryAsync(function(){
		let newPubTopics = [];
		for (let i = 0; i < newPubTopicListItems.get_count(); i++) {
			let eachItem = newPubTopicListItems.getItemAtIndex(i);
			let temp = {};
			temp.ID = eachItem.get_item('ID');
			temp.Title = eachItem.get_item('Title');
			temp.SearchTopicArabic = eachItem.get_item('SearchTopicArabic');
			newPubTopics.push(temp);
		}
		let newPubAuthors = [];
		for (let i = 0; i < newPubAuthorListItems.get_count(); i++) {
			let eachItem = newPubAuthorListItems.getItemAtIndex(i);
			let temp = {};
			temp.ID = eachItem.get_item('ID');
			temp.Title = eachItem.get_item('Title');
			temp.StaffArabicTitle = eachItem.get_item('StaffArabicTitle');
			temp.ImageUrl = eachItem.get_item('ImageUrl');
			newPubAuthors.push(temp);
		}
		for(let i=0;i<newListItems.get_count();i++){
			let eachSearch = newListItems.getItemAtIndex(i);

			let pubDateStr=eachSearch.get_item('SearchDate');
			if(pubDateStr){
				let year=getFormattedDate(pubDateStr).split(" ")[2];
				if($("#ddlSearchYear option:contains('"+year+"')").length==0)
					$("#ddlSearchYear").append("<option>" + year + "</option>");
			}

			let newPubTopic = eachSearch.get_item("SearchTopicIDs");
			if (newPubTopic){
				let pubTopicID=newPubTopic.get_lookupId();
				let itemPubTopics=newPubTopics.find(x=>x.ID==pubTopicID);
				if(itemPubTopics){
					let finalValue=isArabic?itemPubTopics.SearchTopicArabic:itemPubTopics.Title;
					let topicID=itemPubTopics.ID;
					if($("#searchTypeFilter button:contains('"+finalValue+"')").length==0)
						$("#searchTypeFilter").append("<button data-topicId='"+topicID+"' class='btn btn-light' type='button'>"+finalValue+"</button>");
				}
			}
			let newPubAuthor = eachSearch.get_item("SearchAuthorIDs");
			if (newPubAuthor){
				let newPubAuthorID=newPubAuthor[0].get_lookupId();
				let itemPubAuthors=newPubAuthors.find(x=>x.ID==newPubAuthorID);
				if(itemPubAuthors){
					let authorTitle =isArabic?"بواسطة "+itemPubAuthors.StaffArabicTitle:"By "+itemPubAuthors.Title;
					let authorId=itemPubAuthors.ID;
					if($("#ddlSearchAuthors option:contains('"+authorTitle+"')").length==0)
						$("#ddlSearchAuthors").append("<option value='"+authorId+"'>" + authorTitle + "</option>");
				}
			}
		}
		$("#ddlSearchYear,#ddlSearchAuthors").selectpicker({
			style: "btn-light",
			width: "100%",
		});
		bindFilterEvents();
	},failure);
}
function bindFilterEvents() {
	$("#searchTypeFilter button").on("click", function () {
		isRefreshData=true;
		$("#searchTypeFilter button.all").removeClass("btn-primary btn-light").addClass("btn-light");
		$(this).toggleClass("btn btn-light btn btn-primary");

		let allSelectedValues = [];
		$("#searchTypeFilter button.btn-primary").each(function (index, item) {
			allSelectedValues.push($(item).text());
		});

		if (allSelectedValues.length == 0)
			$("#searchTypeFilter button.all").removeClass("btn-primary btn-light").addClass("btn-primary");

		if (allSelectedValues.indexOf(_allTopicFilterValue) > -1) {
			$("#searchTypeFilter button").removeClass("btn-primary btn-light").addClass("btn-light");
			$("#searchTypeFilter button.all").removeClass("btn-primary btn-light").addClass("btn-primary");
		}
		filterContent();
	});

	$('#ddlSearchAuthors,#ddlSearchYear').on('changed.bs.select', function (e, clickedIndex, newValue, oldValue) {
		isRefreshData=true;
		filterContent();
	});

	$("#resetFilter").on("click",function(){
		$("#searchTypeFilter button").removeClass("btn-primary btn-light").addClass("btn-light");
		$("#searchTypeFilter button.all").removeClass("btn-primary btn-light").addClass("btn-primary");
		//Below changes fire event automatically.
		$('#ddlSearchYear').selectpicker('val', _allYearFilterValue);
		setTimeout(function() { $('#ddlSearchAuthors').selectpicker('val', _allAuthorFilterValue); }, 2000);
	});
}
function filterContent(){

	let finalQuery=[];

	let pubTypeFilterValues = [];
	$("#searchTypeFilter button.btn-primary").each(function (index, item) {
		let topicId=$(item).attr("data-topicId");
		let topicText=$(item).text();
		if(topicId && topicText !=_allTopicFilterValue){
			let tempQuery="";
			tempQuery = "<Eq><FieldRef Name='SearchTopicIDs' LookupId='TRUE'/>";
			tempQuery += "<Value Type='Lookup'>"+topicId+"</Value>";
			tempQuery += "</Eq>";
			pubTypeFilterValues.push(tempQuery);
		}
	});
	let pubTypeFilterStr=generateCamlQuery(pubTypeFilterValues,"or");
	if(pubTypeFilterStr)
		finalQuery.push(pubTypeFilterStr);

	let authorFilterValues=[];
	var authorValue = $("#ddlSearchAuthors").val();
	if (authorValue && authorValue != _allAuthorFilterValue) {
		let tempQuery="";
		tempQuery = "<Contains><FieldRef Name='SearchAuthorIDs' LookupId='TRUE'/>";
		tempQuery += "<Value Type='LookupMulti'>"+authorValue+"</Value>";
		tempQuery += "</Contains>";
		authorFilterValues.push(tempQuery);
	}
	let authorFilterStr=generateCamlQuery(authorFilterValues,"or");
	if(authorFilterStr)
		finalQuery.push(authorFilterStr);


	let yearFilterValues=[];
	var filterYear = $("#ddlSearchYear").val();
	if (filterYear && filterYear != _allYearFilterValue) {
		let fromDate = filterYear+"-01-01";
		let toDate  = filterYear+"-12-31"

		let tempQuery1="";
		tempQuery1 = "<Geq><FieldRef Name='SearchDate' />";
		tempQuery1 += "<Value IncludeTimeValue='FALSE' Type='DateTime'>"+fromDate+"</Value>";
		tempQuery1 += "</Geq>";
		yearFilterValues.push(tempQuery1);

		let tempQuery2="";
		tempQuery2 = "<Leq><FieldRef Name='SearchDate' />";
		tempQuery2 += "<Value IncludeTimeValue='FALSE' Type='DateTime'>"+toDate+"</Value>";
		tempQuery2 += "</Leq>";
		yearFilterValues.push(tempQuery2);
	}
	let yearFilterStr=generateCamlQuery(yearFilterValues,"and");
	if(yearFilterStr)
		finalQuery.push(yearFilterStr);
	
		let whereQuery = "<Where>";
	whereQuery += generateCamlQuery(finalQuery,"and");;
	whereQuery += "</Where>";
	bindSearchData(whereQuery);
}

function setupLanguage(){
	$("#sectionTitleAuthor").text(isArabic?"أبرز المؤلفين":"Featured Authors");
	$("#btnApplyFilter,#applyFilter2").text(isArabic?"تطبيق الفلاتر":"Apply Filters");

	$("#titleYearFilter").text(isArabic?"التصفية حسب السنة":"Filter By Year");
	$("#titleAuthorFilter").text(isArabic?"تصفية حسب المؤلف":"Filter By Author");
	$("#titleTopicFilter").text(isArabic?"تصفية حسب الموضوع":"Filter By Topic");

	$("#resetFilter").text(isArabic?"إعادة تعيين الفلاتر":"Reset Filters");
	$("#backText").text(isArabic?"عودة":"Back");
}