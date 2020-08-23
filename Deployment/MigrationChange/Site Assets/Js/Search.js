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

let sortColumnName="";
let sortDirection=0; //0-asc, 1-desc
let defaultSearchQuery="";
let contentSearchQuery="";

let isFilterEventBind=false;
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
	CType = decodeURI(urlParams.get('CType')?urlParams.get('CType'):urlParams.get('ctype'));

	$("#searchHeading").text(isArabic?"نتائج البحث عن '"+searchText+"'":"Search results for '"+searchText+"'");

	setDefaultFilterValues();

	contentSearchQuery=CType=='0'?"(ContentType:'"+CTypeValues.Publication+"' OR ContentType:'"+CTypeValues.Blog+"' OR ContentType:'"+CTypeValues.News+"')":"(ContentType:'"+CType+"')";
	defaultSearchQuery=contentSearchQuery;
	bindSearchData(0);
	bindLoadMoreEvent();
	setupLanguage();

	//For sharing site
	let metaTitle="Search";
	let metaDesc="Motife Search";
	let metaImageUrl=_spPageContextInfo.webLogoUrl;
	$("head").append("<meta property='og:title' content='"+metaTitle+"'>");
	$("head").append("<meta property='og:description' content='"+metaDesc+"'>");
	$("head").append("<meta property='og:image' content='"+metaImageUrl+"'>");
	$("head").append("<meta name='twitter:card' content='"+metaDesc+"'>");
}

function bindSearchData(startIndex){
	if(isRefreshData){
		$("#searchResultDiv").html("");
		pubCollections.RetrieveResultsets=[];
		pubCollections.MainResultSet=[];
		pubCollections.NextResultPosition=0;
		pubCollections.StartIndex=0;
		pubCollections.EndIndex=0;
		pubCollections.TotalItemsCount=0;
		loadMoreHideShow();
	}
	ctx = SP.ClientContext.get_current();
	keywordQuery = new Microsoft.SharePoint.Client.Search.Query.KeywordQuery(ctx);
	keywordQuery.set_trimDuplicates(false);
	let queryText="\""+searchText+"\"";
	if(contentSearchQuery)
		queryText+=" AND "+contentSearchQuery;
	else
		queryText+=" AND "+defaultSearchQuery;
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

	keywordQuery.set_refiners('ContentType,PublicationDateOWSDATE,ContentDateOWSDATE,NewsDateOWSDATE');

	if(sortColumnName){
		keywordQuery.set_enableSorting(true); 
		let sortProperties=keywordQuery.get_sortList();
		sortProperties.add(sortColumnName, sortDirection);
	}

	searchExecutor = new Microsoft.SharePoint.Client.Search.Query.SearchExecutor(ctx);
	mySearchResult = searchExecutor.executeQuery(keywordQuery);

	ctx.executeQueryAsync(
		function () {
			let searchDataObj=mySearchResult.m_value.ResultTables;
			if(searchDataObj){
				let searchData=searchDataObj[0];
				let refinements=searchDataObj[1];
				let resultItemsTotal=searchData.TotalRows;
				let currentResultData=searchData.ResultRows;
				if(currentResultData.length>0){
					$("#searchCountLabel").text(isArabic?"مظهر 1-"+(startIndex+currentResultData.length)+" من "+resultItemsTotal+" نتائج البحث":"Showing 1-"+(startIndex+currentResultData.length)+" of "+resultItemsTotal+" search results");
					pubCollections.StartIndex=startIndex;
					pubCollections.EndIndex=startIndex+currentResultData.length;
					pubCollections.TotalItemsCount=resultItemsTotal;
					fillSearchItems(currentResultData);
					if(!isFilterEventBind){
						isFilterEventBind=true;
						setFilterValues(refinements);
						bindFilterEvents();
					}
				}
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
		tempObj.searchItemDate=eachSearch.LastModifiedTime;

		if(tempObj.ContentType==CTypeValues.Publication){
			//tempObj.searchItemDate=eachSearch.PublicationDateOWSDATE;
			tempObj.searchItemTitle=isArabic?eachSearch.PublicationArabicTitleOWSTEXT:eachSearch.Title;
			tempObj.searchItemDesc=isArabic?eachSearch.PublicationArabicDetailsOWSMTXT:eachSearch.PublicationDetailsOWSMTXT;
			tempObj.searchItemCategory=isArabic?"النشر":"Publication";
			tempObj.searchItemDetailUrl=_siteUrl +(isArabic?"/ar/pages/":"/Pages/")+"PublicationDetails.aspx?ItemID="+tempObj.ID;
		}
		if(tempObj.ContentType==CTypeValues.Blog){
			//tempObj.searchItemDate=eachSearch.ContentDateOWSDATE;
			tempObj.searchItemTitle=isArabic?eachSearch.BlogArabicTitleOWSTEXT:eachSearch.Title;
			tempObj.searchItemDesc=isArabic?eachSearch.BlogContentArabic:eachSearch.BlogContent;
			tempObj.searchItemCategory=isArabic?"المدونة":"Blog";
			tempObj.searchItemDetailUrl=_siteUrl +(isArabic?"/ar/pages/":"/Pages/")+"BlogDetails.aspx?ItemID="+tempObj.ID;
		}
		if(tempObj.ContentType==CTypeValues.News){
			//tempObj.searchItemDate=eachSearch.NewsDateOWSDATE;
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
	if(pubCollections.TotalItemsCount>pubCollections.MainResultSet.length)
		pubCollections.NextResultPosition=pubCollections.MainResultSet.length;
	else
		pubCollections.NextResultPosition=0;
	fillSearchHtml(pubCollections.MainResultSet, pubCollections.StartIndex, pubCollections.EndIndex);
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

		if (searchItemDate) {
			let year = getFormattedDate(searchItemDate).split(" ")[2];
			if ($("#ddlItemDateFilter option:contains('" + year + "')").length == 0)
				$("#ddlItemDateFilter").append("<option>" + year + "</option>");
		}

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
								"<a href='"+searchDetailUrl+"' class='go-link'>"+(isArabic?"أعرف أكثر":"LEARN MORE")+"</a>"+
							"</div>"+
						"</div>"+
					"</div>";
		$("#searchResultDiv").append(itemHtml);
	}

	$("#ddlSortData,#ddlItemDateFilter").selectpicker({
		style: "btn-light",
		width: "100%",
	});
}

function bindLoadMoreEvent(){
	$("#searchLoadMore").on("click",function(){
		isRefreshData=false;
		if (pubCollections.NextResultPosition && pubCollections.NextResultPosition!= 0)
			bindSearchData(pubCollections.NextResultPosition);
	});
}
function loadMoreHideShow(){
	if(pubCollections.NextResultPosition==0 || pubCollections.MainResultSet.length==0)
		$("#searchLoadMore").hide();
	else
		$("#searchLoadMore").show();
}

function setDefaultFilterValues(){
	$("#ddlItemDateFilter,#ddlSortData").selectpicker("destroy");
	$("#ddlItemDateFilter option,#ddlSortData option,#CTypeFilterValues button").remove();

	$("#CTypeFilterValues").append("<button data-CTypeName='0' class='btn btn-primary all' type='button'>"+(isArabic?"الكل":"All")+"</button>");
	$("#ddlItemDateFilter").append("<option value='0'>" + (isArabic?"جميع السنوات":"All Years") + "</option>");

	$("#ddlSortData").append("<option value='0'>" +(isArabic?"ملاءمة":"Relevance") + "</option>");
	$("#ddlSortData").append("<option value='1'>" +(isArabic?"التاريخ تصاعديا":"Date Asc") + "</option>");
	$("#ddlSortData").append("<option value='2'>" +(isArabic?"التاريخ تنازلي":"Date Desc") + "</option>");
}
function bindFilterEvents() {
	$("#CTypeFilterValues button").on("click", function () {
		isRefreshData=true;
		$("#CTypeFilterValues button.all").removeClass("btn-primary btn-light").addClass("btn-light");
		$(this).toggleClass("btn btn-light btn btn-primary");

		let allSelectedValues = [];
		$("#CTypeFilterValues button.btn-primary").each(function (index, item) {
			allSelectedValues.push($(item).text());
		});

		if (allSelectedValues.length == 0)
			$("#CTypeFilterValues button.all").removeClass("btn-primary btn-light").addClass("btn-primary");

		let defaultCTypeFilter=isArabic?"الكل":"All";
		if (allSelectedValues.indexOf(defaultCTypeFilter) > -1) {
			$("#CTypeFilterValues button").removeClass("btn-primary btn-light").addClass("btn-light");
			$("#CTypeFilterValues button.all").removeClass("btn-primary btn-light").addClass("btn-primary");
		}
		filterContent();
	});

	$('#ddlSortData,#ddlItemDateFilter').on('changed.bs.select', function (e, clickedIndex, newValue, oldValue) {
		isRefreshData=true;
		filterContent();
	});

	$("#btnFilter").on("click",function(){
		isRefreshData=true;
		filterContent();
	});

	$("#resetFilter").on("click",function(){
		$("#CTypeFilterValues button").removeClass("btn-primary btn-light").addClass("btn-light");
		$("#CTypeFilterValues button.all").removeClass("btn-primary btn-light").addClass("btn-primary");
		//Below changes fire event automatically.
		$('#ddlItemDateFilter').selectpicker('val', '0');
		setTimeout(function() { $('#ddlSortData').selectpicker('val', '0'); }, 2000);
	});
}
function filterContent(){

	let finalQuery=[];

	let cTypeFilterValues = [];
	$("#CTypeFilterValues button.btn-primary").each(function (index, item) {
		let cTypeName=$(item).attr("data-CTypeName");
		if(cTypeName && cTypeName !='0'){
			let tempQuery="ContentType:\""+cTypeName+"\"";
			cTypeFilterValues.push(tempQuery);
		}
	});
	if(cTypeFilterValues.length>0){
		let cTypeFilterStr="("+cTypeFilterValues.join(" OR ")+")";
		finalQuery.push(cTypeFilterStr);
	}
	else
		finalQuery.push(defaultSearchQuery);

	var sortValue = $("#ddlSortData").val();
	if (sortValue && sortValue != '0') {
		sortColumnName="LastModifiedTime";
		if(sortValue=="1")
			sortDirection=0; //0-asc, 1-desc
		else
			sortDirection=1; //0-asc, 1-desc
	}
	else
		sortColumnName="";

	let yearFilterValues=[];
	var filterYear = $("#ddlItemDateFilter").val();
	if (filterYear && filterYear != '0') {
		let fromDate =filterYear+"/01/01";
		let toDate  =filterYear+"/12/31";

		let tempQuery1="LastModifiedTime="+fromDate+".."+toDate;
		yearFilterValues.push(tempQuery1);
	}
	if(yearFilterValues.length>0){
		let yearFilterStr="("+yearFilterValues.join(" OR ")+")";
		finalQuery.push(yearFilterStr);
	}
	contentSearchQuery=finalQuery.join(" AND ");
	bindSearchData(0);
}

function setupLanguage(){
	$("#btnApplyFilter").text(isArabic?"تطبيق الفلاتر":"Apply Filters");
	$("#titleYearFilter").text(isArabic?"التصفية حسب السنة":"Filter By Year");
	$("#resetFilter").text(isArabic?"إعادة تعيين الفلاتر":"Reset Filters");
	$("#backText").text(isArabic?"عودة":"Back");

	$("#pageName").text(isArabic?"نتائج البحث":"Search results");
	$("#filterSectionLabel").text(isArabic?"تصفية حسب القسم":"Filter by section");
	$("#filterSortLabel").text(isArabic?"صنف حسب":"Sort by");
}

function setFilterValues(refinements){
	let refinerResults=refinements.ResultRows;
	for(let i=0;i<refinerResults.length;i++){
		let eachRefiner=refinerResults[i];

		let refinerName=eachRefiner.RefinerName;
		if(refinerName=="ContentType"){
			let refinementTitle=eachRefiner.RefinementName;
			let refinementValue=eachRefiner.RefinementValue;
			if ($("#CTypeFilterValues button:contains('" + refinementTitle + "')").length == 0)
				$("#CTypeFilterValues").append("<button data-CTypeName='" + refinementValue + "' class='btn btn-light' type='button'>" + refinementTitle + "</button>");
		}
	}
}