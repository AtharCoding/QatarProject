"use strict";
var _siteUrl = "";

var _allYearFilterValue=isArabic?"جميع السنوات":"All Years";
var _allAuthorFilterValue=isArabic?"جميع المؤلفين": "All Authors";
var _allTopicFilterValue=isArabic?"الكل":"All";

var tempCounter=0;
var ctx;
var pubList;
var pubCamlQuery;
var listItems;
var pubTopicListItems;
var itemLimit=4;
var featuredAuthorCollection=[];
var pubCollections={
	RetrieveResultsets:[],
	MainResultSet:[],
	NextResultPosition:0,
	StartIndex:0,
	EndIndex:0	
};
var isRefreshData=false;
var smallContentLimit=250;
var MediumContentLimit=330;
var largeContentLimit=480;
var featureContentLimit=180;

$(document).ready(function () {
	document.title = "Publications";
	_siteUrl = _spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', publicationStart);
});

function publicationStart() {
	getListDetails(_listTitlePublication);
	bindPublicationData("");
	bindLoadMoreEvent();
	setDefaultFilterValues();
	fillPublicationsFilterValues();
	setupLanguage();

	//For sharing site
	let metaTitle="Publication";
	let metaDesc="Motife Publication";
	let metaImageUrl=_spPageContextInfo.webLogoUrl;
	$("head").append("<meta property='og:title' content='"+metaTitle+"'>");
	$("head").append("<meta property='og:description' content='"+metaDesc+"'>");
	$("head").append("<meta property='og:image' content='"+metaImageUrl+"'>");
	$("head").append("<meta name='twitter:card' content='"+metaDesc+"'>");
}

function bindPublicationData(whereQuery){
	if(isRefreshData)
		$("#publicationContent").html("");

	pubCollections.RetrieveResultsets=[];
	pubCollections.MainResultSet=[];
	pubCollections.NextResultPosition="";
	pubCollections.StartIndex=0;
	pubCollections.EndIndex=0;

	ctx = SP.ClientContext.get_current();
	pubList = ctx.get_site().get_rootWeb().get_lists().getByTitle(_listTitlePublication);

	pubCamlQuery = new SP.CamlQuery();
	let query = "<View><Query><OrderBy><FieldRef Name='IsFeatured1' Ascending='False' /><FieldRef Name='Modified' Ascending='False'/></OrderBy>";
	if(whereQuery)
		query += whereQuery;
	query += "</Query><RowLimit>"+itemLimit+"</RowLimit></View>";
	pubCamlQuery.set_viewXml(query);
	listItems = pubList.getItems(pubCamlQuery);

	let pubTopicList = ctx.get_site().get_rootWeb().get_lists().getByTitle(_listTitlePublicationTopics);
	pubTopicListItems=pubTopicList.getItems(SP.CamlQuery.createAllItemsQuery());

	ctx.load(listItems);
	ctx.load(pubTopicListItems);
	ctx.executeQueryAsync(function(){
		pubCollections.StartIndex=0;
		pubCollections.EndIndex=listItems.get_count();
		pubCollections.NextResultPosition=listItems.get_listItemCollectionPosition();
		loadMoreHideShow();
		fillPublicationItems();
	},failure);
}

function fillPublicationItems(){
	let pubTopics = [];
    for (let i = 0; i < pubTopicListItems.get_count(); i++) {
        let eachItem = pubTopicListItems.getItemAtIndex(i);
        let temp = {};
        temp.ID = eachItem.get_item('ID');
        temp.Title = eachItem.get_item('Title');
        temp.PublicationTopicArabic = eachItem.get_item('PublicationTopicArabic');
        pubTopics.push(temp);
	}
	tempCounter=0;
	for(let i=0;i<listItems.get_count();i++){
		let tempObj={};
		tempObj.totalItemsCount=listItems.get_count();
		let eachPublication = listItems.getItemAtIndex(i);
		let pubAuthIDsArr=[];
		var pubAuthorIDs = eachPublication.get_item('PublicationAuthorIDs');
		for(let j = 0;j < pubAuthorIDs.length;j++) {
			pubAuthIDsArr.push(pubAuthorIDs[j].get_lookupId());
		}

		if(pubAuthIDsArr.length>0){
			tempObj.Index=i;
			tempObj.ID=eachPublication.get_item('ID');
			tempObj.Title=isArabic?eachPublication.get_item("PublicationArabicTitle"):eachPublication.get_item('Title');
			tempObj.IsFeatured1=eachPublication.get_item('IsFeatured1');

			let pubDateStr=eachPublication.get_item('PublicationDate');
			if(pubDateStr)
				tempObj.PublicationDate=getFormattedDate(pubDateStr);

			let pubDetails=isArabic?eachPublication.get_item("PublicationArabicDetails"):eachPublication.get_item("PublicationDetails");
			if(pubDetails)
				tempObj.PublicationDetails=$("<div></div>").append(pubDetails).text();


			let pubTopic = eachPublication.get_item("PublicationTopicIDs");
			if (pubTopic){
				let pubTopicID=pubTopic.get_lookupId();
				let itemPubTopics=pubTopics.find(x=>x.ID==pubTopicID);
				if(itemPubTopics)
					tempObj.PublicationTopicIDs ={Title:isArabic?itemPubTopics.PublicationTopicArabic:itemPubTopics.Title};
			}
			
			let imgStr=eachPublication.get_fieldValues()['ImageUrl'];
			if(imgStr)
				tempObj.ImageUrl=getImageSrcValue(imgStr);
			
			let authorCamlQuery=createCamlQueryByIDArr(pubAuthIDsArr);
			getStaffDetailsByQuery(authorCamlQuery,tempObj,function(staffCollection, tempObj){
				tempCounter++;
				tempObj.staffCollection=staffCollection;
				pubCollections.RetrieveResultsets.push(tempObj);
				if(tempCounter==tempObj.totalItemsCount){
					pubCollections.RetrieveResultsets.sort(function(a,b) {return a.Index - b.Index;});
					let mainLength=pubCollections.MainResultSet.length;
					if(mainLength>0){
						$.each(pubCollections.RetrieveResultsets, function() {
							this.Index = mainLength+this.Index;
						});
					}
					pubCollections.MainResultSet=pubCollections.MainResultSet.concat(pubCollections.RetrieveResultsets);
					pubCollections.RetrieveResultsets=[];
					fillPublicationHtml(pubCollections.MainResultSet,pubCollections.StartIndex,pubCollections.EndIndex);
					loadMoreHideShow();	
				}
			},failure);
		}
	}
}

function fillPublicationHtml(resultSet,startIndex,endIndex){
	let containerDesign="<div class='row'>"+
									"<div class='col-lg-8'>"+
										"##First##"+
										"<div class='row'>"+
											"##Third##"+
											"##Fourth##"+
										"</div>"+
									"</div>"+
									"##Second##"+
								"</div>"+
								"<div class='row'>"+
									"<div class='col-lg-8'>"+
										"##Fifth##"+
										"##Sixth##"+
									"</div>"+
									"##Seventh##"+
									"##Others##"+
								"</div>";
	let defaultHtmlSet="";
	for (let i = 0; i < endIndex; i++) {
		let eachPublication = resultSet[i];
		let htmlDesign=htmlDesignResult(eachPublication);
		let actualItemIndex=eachPublication.Index;
		switch(actualItemIndex){
			case 0:
				containerDesign=containerDesign.replace("##First##",htmlDesign.featuredElement);
				break;
			case 1:
				containerDesign=containerDesign.replace("##Second##",htmlDesign.verticalElement);
				break;
			case 2:
				containerDesign=containerDesign.replace("##Third##",htmlDesign.topSmallSix);
				break;
			case 3:
				containerDesign=containerDesign.replace("##Fourth##",htmlDesign.topSmallSix);
				break;
			case 4:
				containerDesign=containerDesign.replace("##Fifth##",htmlDesign.horizontalDiv);
				break;
			case 5:
				containerDesign=containerDesign.replace("##Sixth##",htmlDesign.horizontalDiv);
				break;
			case 6:
				containerDesign=containerDesign.replace("##Seventh##",htmlDesign.verticalElement);
				break;
			default:
				defaultHtmlSet +=htmlDesign.smallFour;
				break;
		}

		let isFeaturePub=eachPublication.IsFeatured1;
		if(isFeaturePub)
		{
			let featuredPubStaff=eachPublication.staffCollection;
			for(let i=0;i<featuredPubStaff.length;i++)
			{
				let staffDetail=featuredPubStaff[i];
				let ID=staffDetail.ID;
				let existingStaff=featuredAuthorCollection.find(x=>x.ID==ID);
				if(!existingStaff)
				{
					featuredAuthorCollection.push({
						ID:staffDetail.ID,
						Title:staffDetail.Title,
						ImageUrl:staffDetail.ImageUrl,
						ProfileDetailPageURL:staffDetail.ProfileDetailPageURL,
						StaffPosition:staffDetail.StaffPositionLookup.Title
					});
				}
			}
		}
	}
	if(defaultHtmlSet)
		containerDesign=containerDesign.replace("##Others##",defaultHtmlSet);
	
	containerDesign=containerDesign.replace("##First##", "");
	containerDesign=containerDesign.replace("##Second##", "");
	containerDesign=containerDesign.replace("##Third##", "");
	containerDesign=containerDesign.replace("##Fourth##", "");
	containerDesign=containerDesign.replace("##Fifth##", "");
	containerDesign=containerDesign.replace("##Sixth##", "");
	containerDesign=containerDesign.replace("##Seventh##", "");
	containerDesign=containerDesign.replace("##Others##", "");
	$("#publicationContent").html(containerDesign);

	bindFeaturedAuthor();
}

function bindFeaturedAuthor()
{
	$("#featuredAuthorDiv").html("");
	$("#featuredAuthorCarousel").html("");

	if(featuredAuthorCollection.length==0)
		$("#key-researchers").hide();
	else{
		for(let i=0;i<featuredAuthorCollection.length;i++)
		{
			let staffDetail=featuredAuthorCollection[i];
			let staffHtml="<div class='author-item'>"+
							"<img src='"+staffDetail.ImageUrl+"'/>"+
							"<div>"+
								"<a href='"+staffDetail.ProfileDetailPageURL+"'>"+
									"<h4>"+staffDetail.Title+"</h4>"+
								"</a>"+
								"<p>"+staffDetail.StaffPosition+"</p>"+
							"</div>"+
						"</div>";
			$("#featuredAuthorDiv").append(staffHtml);
	
			let carouselStaffHtml="<div class='item'>"+
										"<a href='"+staffDetail.ProfileDetailPageURL+"'>"+
											"<div class='key-researcher'>"+
												"<img src='"+staffDetail.ImageUrl+"' />"+
												"<h4>"+staffDetail.Title+"</h4>"+
												"<p>"+staffDetail.StaffPosition+"</p>"+
											"</div>"+
										"</a>"+
									"</div>";
			$("#featuredAuthorCarousel").append(carouselStaffHtml);
		}
		createOwlSlider();
	}
}

function bindLoadMoreEvent(){
	$("#publicationLoadMore").on("click",function(){
		isRefreshData=false;
		if (pubCollections.NextResultPosition != null) {
			pubCamlQuery.set_listItemCollectionPosition(pubCollections.NextResultPosition);
			listItems = pubList.getItems(pubCamlQuery);
			ctx.load(listItems);
			//Call the same function recursively until all the items in the current criteria are fetched.
			ctx.executeQueryAsync(function(){
				pubCollections.NextResultPosition=listItems.get_listItemCollectionPosition();
				pubCollections.StartIndex=pubCollections.EndIndex;
				pubCollections.EndIndex=pubCollections.StartIndex+listItems.get_count();
				fillPublicationItems();
			}, failure);
		}
	});
}
function loadMoreHideShow(){
	if(pubCollections.NextResultPosition==null || pubCollections.MainResultSet.length==0)
		$("#publicationLoadMore").hide();
	else
		$("#publicationLoadMore").show();
}

function setDefaultFilterValues(){
	$("#ddlPublicationYear,#ddlPublicationAuthors").selectpicker("destroy");
	$("#ddlPublicationYear option,#ddlPublicationAuthors option,#publicationTypeFilter button").remove();

	$("#publicationTypeFilter").append("<button class='btn btn-primary all' type='button'>" + _allTopicFilterValue + "</button>");
	$("#ddlPublicationYear").append("<option>" + _allYearFilterValue + "</option>");
	$("#ddlPublicationAuthors").append("<option value='"+_allAuthorFilterValue+"'>" +_allAuthorFilterValue + "</option>");

	$("#publicationContent").html("");
}
function fillPublicationsFilterValues(){
	let newCtx = SP.ClientContext.get_current();

	let newPubList = newCtx.get_site().get_rootWeb().get_lists().getByTitle(_listTitlePublication);
	let newPubCamlQuery = new SP.CamlQuery();
	let query = "<View><Query><OrderBy><FieldRef Name='IsFeatured1' Ascending='False' /><FieldRef Name='Modified' Ascending='False'/></OrderBy>";
	query += "</Query><RowLimit>1000</RowLimit></View>";
	newPubCamlQuery.set_viewXml(query);
	let newListItems = newPubList.getItems(newPubCamlQuery);

	let newPubTopicList = newCtx.get_site().get_rootWeb().get_lists().getByTitle(_listTitlePublicationTopics);
	let newPubTopicListItems=newPubTopicList.getItems(SP.CamlQuery.createAllItemsQuery());

	let newPubAuthorList = newCtx.get_site().get_rootWeb().get_lists().getByTitle(_listTitleCHSCommunity);
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
			temp.PublicationTopicArabic = eachItem.get_item('PublicationTopicArabic');
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
			let eachPublication = newListItems.getItemAtIndex(i);

			let pubDateStr=eachPublication.get_item('PublicationDate');
			if(pubDateStr){
				let year=getFormattedDate(pubDateStr).split(" ")[2];
				if($("#ddlPublicationYear option:contains('"+year+"')").length==0)
					$("#ddlPublicationYear").append("<option>" + year + "</option>");
			}

			let newPubTopic = eachPublication.get_item("PublicationTopicIDs");
			if (newPubTopic){
				let pubTopicID=newPubTopic.get_lookupId();
				let itemPubTopics=newPubTopics.find(x=>x.ID==pubTopicID);
				if(itemPubTopics){
					let finalValue=isArabic?itemPubTopics.PublicationTopicArabic:itemPubTopics.Title;
					let topicID=itemPubTopics.ID;
					if($("#publicationTypeFilter button:contains('"+finalValue+"')").length==0)
						$("#publicationTypeFilter").append("<button data-topicId='"+topicID+"' class='btn btn-light' type='button'>"+finalValue+"</button>");
				}
			}
			let newPubAuthor = eachPublication.get_item("PublicationAuthorIDs");
			if (newPubAuthor){
				let newPubAuthorID=newPubAuthor[0].get_lookupId();
				let itemPubAuthors=newPubAuthors.find(x=>x.ID==newPubAuthorID);
				if(itemPubAuthors){
					let authorTitle =isArabic?"بواسطة "+itemPubAuthors.StaffArabicTitle:"By "+itemPubAuthors.Title;
					let authorId=itemPubAuthors.ID;
					if($("#ddlPublicationAuthors option:contains('"+authorTitle+"')").length==0)
						$("#ddlPublicationAuthors").append("<option value='"+authorId+"'>" + authorTitle + "</option>");
				}
			}
		}
		$("#ddlPublicationYear,#ddlPublicationAuthors").selectpicker({
			style: "btn-light",
			width: "100%",
		});
		bindFilterEvents();
	},failure);
}
function bindFilterEvents() {
	$("#publicationTypeFilter button").on("click", function () {
		isRefreshData=true;
		$("#publicationTypeFilter button.all").removeClass("btn-primary btn-light").addClass("btn-light");
		$(this).toggleClass("btn btn-light btn btn-primary");

		let allSelectedValues = [];
		$("#publicationTypeFilter button.btn-primary").each(function (index, item) {
			allSelectedValues.push($(item).text());
		});

		if (allSelectedValues.length == 0)
			$("#publicationTypeFilter button.all").removeClass("btn-primary btn-light").addClass("btn-primary");

		if (allSelectedValues.indexOf(_allTopicFilterValue) > -1) {
			$("#publicationTypeFilter button").removeClass("btn-primary btn-light").addClass("btn-light");
			$("#publicationTypeFilter button.all").removeClass("btn-primary btn-light").addClass("btn-primary");
		}
		filterContent();
	});

	$('#ddlPublicationAuthors,#ddlPublicationYear').on('changed.bs.select', function (e, clickedIndex, newValue, oldValue) {
		isRefreshData=true;
		filterContent();
	});

	$("#resetFilter").on("click",function(){
		$("#publicationTypeFilter button").removeClass("btn-primary btn-light").addClass("btn-light");
		$("#publicationTypeFilter button.all").removeClass("btn-primary btn-light").addClass("btn-primary");
		//Below changes fire event automatically.
		$('#ddlPublicationYear').selectpicker('val', _allYearFilterValue);
		setTimeout(function() { $('#ddlPublicationAuthors').selectpicker('val', _allAuthorFilterValue); }, 2000);
	});
}
function filterContent(){

	let finalQuery=[];

	let pubTypeFilterValues = [];
	$("#publicationTypeFilter button.btn-primary").each(function (index, item) {
		let topicId=$(item).attr("data-topicId");
		let topicText=$(item).text();
		if(topicId && topicText !=_allTopicFilterValue){
			let tempQuery="";
			tempQuery = "<Eq><FieldRef Name='PublicationTopicIDs' LookupId='TRUE'/>";
			tempQuery += "<Value Type='Lookup'>"+topicId+"</Value>";
			tempQuery += "</Eq>";
			pubTypeFilterValues.push(tempQuery);
		}
	});
	let pubTypeFilterStr=generateCamlQuery(pubTypeFilterValues,"or");
	if(pubTypeFilterStr)
		finalQuery.push(pubTypeFilterStr);

	let authorFilterValues=[];
	var authorValue = $("#ddlPublicationAuthors").val();
	if (authorValue && authorValue != _allAuthorFilterValue) {
		let tempQuery="";
		tempQuery = "<Contains><FieldRef Name='PublicationAuthorIDs' LookupId='TRUE'/>";
		tempQuery += "<Value Type='LookupMulti'>"+authorValue+"</Value>";
		tempQuery += "</Contains>";
		authorFilterValues.push(tempQuery);
	}
	let authorFilterStr=generateCamlQuery(authorFilterValues,"or");
	if(authorFilterStr)
		finalQuery.push(authorFilterStr);


	let yearFilterValues=[];
	var filterYear = $("#ddlPublicationYear").val();
	if (filterYear && filterYear != _allYearFilterValue) {
		let fromDate = filterYear+"-01-01";
		let toDate  = filterYear+"-12-31"

		let tempQuery1="";
		tempQuery1 = "<Geq><FieldRef Name='PublicationDate' />";
		tempQuery1 += "<Value IncludeTimeValue='FALSE' Type='DateTime'>"+fromDate+"</Value>";
		tempQuery1 += "</Geq>";
		yearFilterValues.push(tempQuery1);

		let tempQuery2="";
		tempQuery2 = "<Leq><FieldRef Name='PublicationDate' />";
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
	bindPublicationData(whereQuery);
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

function htmlDesignResult(eachPublication){
	let htmlDesign={};
	let publicationDetailUrl =  _siteUrl +(isArabic?"/ar/pages/":"/Pages/") + "PublicationDetails.aspx?ItemID=" + eachPublication.ID;
	let pubDetails = eachPublication.PublicationDetails;
	let pubTitle = eachPublication.Title;
	let pubCategory = eachPublication.PublicationTopicIDs.Title;
	let pubImageUrl = eachPublication.ImageUrl;
	let pubDate=eachPublication.PublicationDate;

	let staffCollection = eachPublication.staffCollection;
	let authorName = "";
	let authImgUrl = "";
	if (staffCollection.length > 0) {
		authorName = staffCollection[0].Title;
		authImgUrl = staffCollection[0].ImageUrl;
	}
	htmlDesign.featuredElement="<div class='row'>"+
									"<div class='col-lg-12'>"+
										"<a href='"+publicationDetailUrl+"'>"+
											"<div class='publication publication-big'>"+
												"<div class='publication-content'>"+
													"<p class='publication-category'>"+pubCategory+"</p>"+
													"<h3 class='publication-title'>"+pubTitle+"</h3>"+
													"<p class='publication-text'>"+pubDetails.slice(0, featureContentLimit)+"</p>"+
													"<div class='publication-author'>"+
														"<img src='"+authImgUrl+"' alt='...'>"+
														"<span>"+authorName+"</span>"+
													"</div>"+
												"</div>"+
												"<div class='publication-img'>"+
													"<img src='"+pubImageUrl+"' alt='...'>"+
												"</div>"+
											"</div>"+
										"</a>"+
									"</div>"+
								"</div>";
	htmlDesign.verticalElement="<div class='col-lg-4'>"+
									"<a href='"+publicationDetailUrl+"'>"+
										"<div class='publication' style='height: 96%;'>"+
											"<div class='publication-content'>"+
												"<div class='publication-card-img'>"+
													"<img src='"+pubImageUrl+"' alt='...'>"+
												"</div>"+
												"<p class='publication-category'>"+pubCategory+"</p>"+
												"<h3 class='publication-title'>"+pubTitle+"</h3>"+
												"<p class='publication-text'>"+pubDetails.slice(0, MediumContentLimit)+"</p>"+
												"<div class='publication-author'>"+
													"<img src='"+authImgUrl+"' alt='...'>"+
													"<span>"+authorName+"</span>"+
												"</div>"+
											"</div>"+
										"</div>"+
									"</a>"+
								"</div>";
	htmlDesign.smallFour="<div class='col-lg-4'>"+
							"<a href='"+publicationDetailUrl+"'>"+
								"<div class='publication' style='height: 95%;'>"+
									"<div class='publication-content'>"+
										"<p class='publication-category'>"+pubCategory+"</p>"+
										"<h3 class='publication-title'>"+pubTitle+"</h3>"+
										"<p class='publication-text'>"+pubDetails.slice(0, smallContentLimit)+"</p>"+
										"<div class='publication-author'>"+
											"<img src='"+authImgUrl+"' alt='...'>"+
											"<span>By "+authorName+"</span>"+
										"</div>"+
									"</div>"+
								"</div>"+
							"</a>"+
						"</div>";
	htmlDesign.topSmallSix="<div class='col-lg-6'>"+
								"<a href='"+publicationDetailUrl+"'>"+
									"<div class='publication'>"+
										"<div class='publication-content'>"+
											"<p class='publication-category'>"+pubCategory+"</p>"+
											"<h3 class='publication-title'>"+pubTitle+"</h3>"+
											"<p class='publication-text'>"+pubDetails.slice(0, smallContentLimit)+"</p>"+
											"<div class='publication-author'>"+
												"<img src='"+authImgUrl+"' alt='...'>"+
												"<span>"+authorName+"</span>"+
											"</div>"+
										"</div>"+
									"</div>"+
								"</a>"+
							"</div>";
	htmlDesign.horizontalDiv="<a href='"+publicationDetailUrl+"'>"+
							"<div class='publication'>"+
								"<div class='publication-content'>"+
									"<p class='publication-category'>"+pubCategory+"</p>"+
									"<h3 class='publication-title'>"+pubTitle+"</h3>"+
									"<p class='publication-text'>"+pubDetails.slice(0, largeContentLimit)+"</p>"+
									"<div class='publication-author'>"+
										"<img src='"+authImgUrl+"' alt='...'>"+
										"<span>"+authorName+"</span>"+
									"</div>"+
								"</div>"+
							"</div>"+
						"</a>";
	return htmlDesign;
}