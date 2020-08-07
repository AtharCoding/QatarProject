"use strict";
var _siteUrl = "";
let ItemID="";

var ctx;

var publicationList;
var eventList;

var currentListItem;
var currentItemDetails={};
var researchAuthorIDs=[];

var researchLatestItems="";
var latestResearchItemLimit=4;
var latestResearchCollections=[];


var pubCamlQuery;
var publistItems;
var pubTopicListItems;
var pubItemLimit=5;
var pubAuthorListItems;
var pubCollections={
	RetrieveResultsets:[],
	MainResultSet:[],
	NextResultPosition:0,
	StartIndex:0,
	EndIndex:0	
};


var eventCamlQuery;
var eventListItems;
var eventItemLimit=5;
var eventTypeListItems;
var eventCollections={
	RetrieveResultsets:[],
	MainResultSet:[],
	NextResultPosition:0,
	StartIndex:0,
	EndIndex:0	
};

$(document).ready(function () {
	document.title = "Research Details";
	_siteUrl = _spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', researchDetailStart);
});

function researchDetailStart() {
	setLanguageData();
    const urlParams = new URLSearchParams(window.location.search);
    ItemID = urlParams.get('ItemID')?urlParams.get('ItemID'):urlParams.get('itemid');
    if(ItemID){
        bindResearchData();
		bindLoadMore();
    }
}

function bindResearchData() {
    ctx = new SP.ClientContext();
    let listCollection = ctx.get_web().get_lists();
	let researchList = listCollection.getByTitle(_listTitleResearch);
	publicationList = listCollection.getByTitle(_listTitlePublication);
	let pubTopicList = listCollection.getByTitle(_listTitlePublicationTopics);
	let pubAuthorList = listCollection.getByTitle(_listTitleCommunity);
	eventList = listCollection.getByTitle(_listTitleEvents);
	let eventTypeList = listCollection.getByTitle(_listTitleEventTypes);

	let latestResearchQuery = new SP.CamlQuery();
	let latestResearchText = "<View><Query><OrderBy><FieldRef Name='IsFeatured1' Ascending='False' /><FieldRef Name='Modified' Ascending='False'/></OrderBy>";
	latestResearchText += "</Query><RowLimit>" + latestResearchItemLimit + "</RowLimit></View>";
	latestResearchQuery.set_viewXml(latestResearchText);
	researchLatestItems = researchList.getItems(latestResearchQuery);
	currentListItem = researchList.getItemById(ItemID);

	pubCamlQuery = new SP.CamlQuery();
	let pubQueryText = "<View><Query><OrderBy><FieldRef Name='IsFeatured1' Ascending='False'/><FieldRef Name='Modified' Ascending='False'/></OrderBy>";
    pubQueryText += "</Query><RowLimit>"+pubItemLimit+"</RowLimit></View>";
	pubCamlQuery.set_viewXml(pubQueryText);
	publistItems = publicationList.getItems(pubCamlQuery);
	pubTopicListItems=pubTopicList.getItems(SP.CamlQuery.createAllItemsQuery());
	pubAuthorListItems=pubAuthorList.getItems(SP.CamlQuery.createAllItemsQuery());
	
	eventCamlQuery = new SP.CamlQuery();
	let eventQueryText = "<View><Query><OrderBy><FieldRef Name='IsFeatured1' Ascending='False'/><FieldRef Name='Modified' Ascending='False'/></OrderBy>";
    eventQueryText += "</Query><RowLimit>"+eventItemLimit+"</RowLimit></View>";
	eventCamlQuery.set_viewXml(eventQueryText);
	eventListItems = eventList.getItems(eventCamlQuery);
	eventTypeListItems = eventTypeList.getItems(SP.CamlQuery.createAllItemsQuery());

	ctx.load(eventListItems);
	ctx.load(eventTypeListItems);

    ctx.load(publistItems);
	ctx.load(pubTopicListItems);
	ctx.load(pubAuthorListItems);

	ctx.load(researchLatestItems);
	ctx.load(currentListItem);
	
    ctx.executeQueryAsync(function () {
		fillResearchItem();
		
		pubCollections.StartIndex=0;
		pubCollections.EndIndex=publistItems.get_count();
		pubCollections.NextResultPosition=publistItems.get_listItemCollectionPosition();
		loadMorePubHideShow();
		fillPublicationItems();

		eventCollections.StartIndex=0;
		eventCollections.EndIndex=eventListItems.get_count();
		eventCollections.NextResultPosition=eventListItems.get_listItemCollectionPosition();
		loadMoreEventHideShow();
		fillEventItems();

    }, failure);
}

/////////////////////////////////////////////////////////////////////////////////////////////////

function fillResearchItem() {
	////////////////////////////////////////////////////////////////////////
    currentItemDetails.ID = currentListItem.get_item('ID');
    currentItemDetails.Title = isArabic ? currentListItem.get_item('ResearchArabicTitle') : currentListItem.get_item('Title');
    currentItemDetails.ResearchContent = isArabic ? formatRichTextValue(currentListItem.get_item("ResearchArabicContent")) : formatRichTextValue(currentListItem.get_item("ResearchContent"));
	currentItemDetails.ImageUrl = getImageSrcValue(currentListItem.get_fieldValues()['ImageUrl']);
	let researchAuthorCollection = currentListItem.get_item("ContentWriterName");
	for(var i = 0;i < researchAuthorCollection.length;i++) {
		researchAuthorIDs.push(researchAuthorCollection[i].get_lookupId());
	}
	fillResearchHtml();
	fillResearchAuthorHtml();
	/////////////////////////////////////////////////////////////////////////

	for (let i = 0; i < researchLatestItems.get_count(); i++) {
		let eachItem = researchLatestItems.getItemAtIndex(i);
		let eachResearch = {};

		eachResearch.ID = eachItem.get_item('ID');
		eachResearch.Title = isArabic ? eachItem.get_item('ResearchArabicTitle') : eachItem.get_item('Title');
		eachResearch.ResearchDetailPageURL = _siteUrl + (isArabic ? "/Pages/Ar/" : "/Pages/") + "ResearchDetails.aspx?ItemID=" + eachItem.get_item('ID');
		eachResearch.ImageUrl = getImageSrcValue(eachItem.get_fieldValues()['ImageUrl']);
		eachResearch.researchContent = isArabic ? eachItem.get_item('ResearchArabicContent') : eachItem.get_item('ResearchContent');
		latestResearchCollections.push(eachResearch);
	}
	fillLatestResearchHtml();

	//////////////////////////////////////////////////////////////////////////////
}

function fillResearchHtml() {
	$("#currentTitleNav,#currentTitleHeading,#currentTitleBlock").text(currentItemDetails.Title);
	$("#currentReasearchContent").html(currentItemDetails.ResearchContent);
}

function fillResearchAuthorHtml() {
	if(researchAuthorIDs.length==0)
		$("#key-researchers").hide();
	else{
		let queryText=createCamlQueryByIDArr(researchAuthorIDs);
		getStaffDetailsByQuery(queryText,0,function(staffCollectionResult){
			let staffCollection=staffCollectionResult;
			for(let i=0;i<staffCollection.length;i++){
				let eachStaff=staffCollection[i];
				var eachStaffDetail="<div class='author-item'>"+
											"<img src='"+eachStaff.ImageUrl+"' />"+
											"<div>"+
												"<a href='"+eachStaff.ProfileDetailPageURL+"'>"+
												"<h4>"+eachStaff.Title+"</h4>"+
												"</a>"+
												"<p>"+eachStaff.StaffPositionLookup.Title+"</p>"+
											"</div>"+
										"</div>";
				$("#staffDetails").append(eachStaffDetail);
				var carouselItemDetail="<div class='item'>"+
											"<a href='"+eachStaff.ProfileDetailPageURL+"'>"+
												"<div class='key-researcher'>"+
													"<div class='key-researcher-img'>"+
														"<img src='"+eachStaff.ImageUrl+"' />"+
													"</div>"+
													"<h4>"+eachStaff.Title+"</h4>"+
													"<p>"+eachStaff.StaffPositionLookup.Title+"</p>"+
												"</div>"+
											"</a>"+
										"</div>";
				$("#staffCarouselDetails").append(carouselItemDetail);
			}
			createOwlSlider();
		},failure);
	}
}

function fillLatestResearchHtml() {
	for (let i = 0; i < latestResearchCollections.length; i++) {
		let eachResearch = latestResearchCollections[i];
		var eachResearchTitle="<div class='related-list-item'>"+
									"<a href='"+eachResearch.ResearchDetailPageURL+"'>"+
										"<p class='related-title'>"+eachResearch.Title+"</p>"+
									"</a>"+
								"</div>";
		$("#latestResearch").append(eachResearchTitle);
	}
}

//////////////////////////////////////////////////////////////////////////////////////////////////////

function fillPublicationItems() {
    let pubTopics = [];
    for (let i = 0; i < pubTopicListItems.get_count(); i++) {
        let eachItem = pubTopicListItems.getItemAtIndex(i);
        let temp = {};
        temp.ID = eachItem.get_item('ID');
        temp.Title = eachItem.get_item('Title');
        temp.PublicationTopicArabic = eachItem.get_item('PublicationTopicArabic');
        pubTopics.push(temp);
	}
	let pubAuthors = [];
    for (let i = 0; i < pubAuthorListItems.get_count(); i++) {
        let eachItem = pubAuthorListItems.getItemAtIndex(i);
        let temp = {};
        temp.ID = eachItem.get_item('ID');
        temp.Title = eachItem.get_item('Title');
		temp.StaffArabicTitle = eachItem.get_item('StaffArabicTitle');
		temp.ImageUrl = eachItem.get_item('ImageUrl');
        pubAuthors.push(temp);
    }
    for (let i = 0; i < publistItems.get_count(); i++) {
        let tempObj = {};
        tempObj.totalItemsCount = publistItems.get_count();
        let eachPublication = publistItems.getItemAtIndex(i);
        tempObj.Index = i;
        tempObj.ID = eachPublication.get_item('ID');
        tempObj.Title = isArabic ? SlicingTitle(eachPublication.get_item('PublicationArabicTitle')) : SlicingTitle(eachPublication.get_item('Title'));
        let pubEngDetails = eachPublication.get_item("PublicationDetails");
        let pubArDetails = eachPublication.get_item("PublicationArabicDetails");
        tempObj.PublicationDetails = isArabic ? SlicingDesc($("<div></div>").append(pubArDetails).text()) : SlicingDesc($("<div></div>").append(pubEngDetails).text());
        tempObj.ImageUrl = getImageSrcValue(eachPublication.get_fieldValues()['ImageUrl']);
        tempObj.PublicationDate = eachPublication.get_item('PublicationDate') ? getFormattedDate(eachPublication.get_item('PublicationDate')) : "";
		
		let pubTopic = eachPublication.get_item("PublicationTopicIDs");
        if (pubTopic){
            let pubTopicID=pubTopic.get_lookupId();
            let itemPubTopics=pubTopics.find(x=>x.ID==pubTopicID);
            if(itemPubTopics)
                tempObj.PublicationTopicIDs ={Title:isArabic?itemPubTopics.PublicationTopicArabic:itemPubTopics.Title};
		}
		
		let pubAuthor = eachPublication.get_item("PublicationAuthorIDs");
        if (pubAuthor){
            let pubAuthorID=pubAuthor[0].get_lookupId();
            let itemPubAuthors=pubAuthors.find(x=>x.ID==pubAuthorID);
            if(itemPubAuthors){
				tempObj.PubAuthorTitle =isArabic?"بواسطة "+itemPubAuthors.StaffArabicTitle:"By "+itemPubAuthors.Title;
				tempObj.PubAuthorImageUrl =getImageSrcValue(itemPubAuthors.ImageUrl);
			}
		}
		
        pubCollections.RetrieveResultsets.push(tempObj);
        pubCollections.RetrieveResultsets.sort(function (a, b) { return a.Index - b.Index; });
        let mainLength = pubCollections.MainResultSet.length;
        if (mainLength > 0) {
            $.each(pubCollections.RetrieveResultsets, function () {
                this.Index = mainLength + this.Index;
            });
        }
        pubCollections.MainResultSet = pubCollections.MainResultSet.concat(pubCollections.RetrieveResultsets);
        pubCollections.RetrieveResultsets = [];
    }
    fillPublicationHtml(pubCollections.MainResultSet, pubCollections.StartIndex, pubCollections.EndIndex);
    loadMorePubHideShow();
}

function fillPublicationHtml(resultSet,startIndex,endIndex){
    if(resultSet.length==0)
        $("#selectedPubSection").hide();
    else{
        for (let i = startIndex; i < endIndex; i++) {
            let eachPublication = resultSet[i];
    
            let pubTitle = eachPublication.Title;
            let publicationDetailUrl = _siteUrl +(isArabic?"/Pages/Ar/":"/Pages/")+"PublicationDetails.aspx?ItemID=" + eachPublication.ID;
            let pubCategory = eachPublication.PublicationTopicIDs.Title;
			let pubDetails = eachPublication.PublicationDetails;
			let pubAuthorTitle=eachPublication.PubAuthorTitle;
			let pubAuthorImageUrl=eachPublication.PubAuthorImageUrl;
			let pubImageUrl=eachPublication.ImageUrl;
			let contentHtml="";
			if(i==0){
				contentHtml="<div class='col-lg-8'>"+
										   "<a href='"+publicationDetailUrl+"'>"+
											   "<div class='publication publication-big'>"+
												   "<div class='publication-content'>"+
													   "<p class='publication-category'>"+pubCategory+"</p>"+
													   "<h3 class='publication-title'>"+pubTitle+"</h3>"+
													   "<p class='publication-text'>"+pubDetails+"</p>"+
													   "<div class='publication-author'>"+
														   "<img src='"+pubAuthorImageUrl+"' alt='...'>"+
														   "<span>"+pubAuthorTitle+"</span>"+
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
										   "<div class='publication'>"+
											   "<a href='"+publicationDetailUrl+"'>"+
												   "<div class='publication-content'>"+
													   "<p class='publication-category'>"+pubCategory+"</p>"+
													   "<h3 class='publication-title'>"+pubTitle+"</h3>"+
													   "<p class='publication-text'>"+pubDetails+"</p>"+
													   "<div class='publication-author'>"+
														   "<img src='"+pubAuthorImageUrl+"' alt='...'>"+
														   "<span>"+pubAuthorTitle+"</span>"+
													   "</div>"+
												   "</div>"+
											   "</a>"+
										   "</div>"+
									   "</div>";
		   }
            $("#publicationContent").append(contentHtml);
        }
	}
	
	
}

function loadMorePubHideShow(){
	if(pubCollections.NextResultPosition==null || pubCollections.MainResultSet.length==0)
		$("#publicationLoadMore").hide();
	else
		$("#publicationLoadMore").show();
}

//////////////////////////////////////////////////////////////////////////////////////////////////

function fillEventItems() {
	let eventTypes = [];
    for (let i = 0; i < eventTypeListItems.get_count(); i++) {
        let eachItem = eventTypeListItems.getItemAtIndex(i);
        let temp = {};
        temp.ID = eachItem.get_item('ID');
        temp.Title = eachItem.get_item('Title');
        temp.EventTypeArabic = eachItem.get_item('EventTypeArabic');
        eventTypes.push(temp);
	}
    for (let i = 0; i < eventListItems.get_count(); i++) {
        let tempObj = {};
        tempObj.totalItemsCount = eventListItems.get_count();
        let eachEvent = eventListItems.getItemAtIndex(i);
        tempObj.Index = i;
        tempObj.ID = eachEvent.get_item('ID');
        tempObj.Title = isArabic ? SlicingTitle(eachEvent.get_item('EventArabicTitle')) : SlicingTitle(eachEvent.get_item('Title'));
        tempObj.ImageUrl = getImageSrcValue(eachEvent.get_fieldValues()['ImageUrl']);
		tempObj.EventStartDate = eachEvent.get_item('EventStartDate') ? getFormattedDate(eachEvent.get_item('EventStartDate')) : "";
		tempObj.EventEndDate = eachEvent.get_item('EventEndDate') ? getFormattedDate(eachEvent.get_item('EventEndDate')) : "";
		
		let eventTypeObj = eachEvent.get_item("EventTypeLookup");
        if (eventTypeObj){
            let eventTypeID=eventTypeObj.get_lookupId();
            let itemEventType=eventTypes.find(x=>x.ID==eventTypeID);
            if(itemEventType)
                tempObj.EventTypeTitle =isArabic?itemEventType.EventTypeArabic:itemEventType.Title;
		}
		
        eventCollections.RetrieveResultsets.push(tempObj);
        eventCollections.RetrieveResultsets.sort(function (a, b) { return a.Index - b.Index; });
        let mainLength = eventCollections.MainResultSet.length;
        if (mainLength > 0) {
            $.each(eventCollections.RetrieveResultsets, function () {
                this.Index = mainLength + this.Index;
            });
        }
        eventCollections.MainResultSet = eventCollections.MainResultSet.concat(eventCollections.RetrieveResultsets);
        eventCollections.RetrieveResultsets = [];
    }
    fillEventHtml(eventCollections.MainResultSet, eventCollections.StartIndex, eventCollections.EndIndex);
    loadMoreEventHideShow();
}

function fillEventHtml(resultSet,startIndex,endIndex){
    if(resultSet.length==0)
        $("#related-events").hide();
    else{
        for (let i = startIndex; i < endIndex; i++) {
            let eachEvent = resultSet[i];
    
            let eventTitle = eachEvent.Title;
            let eventlicationDetailUrl = _siteUrl +(isArabic?"/Pages/Ar/":"/Pages/")+"EventDetails.aspx?ItemID=" + eachEvent.ID;
            let EventTypeTitle = eachEvent.EventTypeTitle;
			let imageUrl = eachEvent.ImageUrl;
			let eventStartStr=eachEvent.EventStartDate?eachEvent.EventStartDate.split(" ")[0]+" "+eachEvent.EventStartDate.split(" ")[1]:"";
			let eventEndStr=eachEvent.EventEndDate?eachEvent.EventEndDate.split(" ")[0]+" "+eachEvent.EventEndDate.split(" ")[1]:"";
			let eventDetailHtml="<div class='col-lg-6'>"+
									"<div class='related-event'>"+
										"<a href='"+eventlicationDetailUrl+"'>"+
											"<div class='row'>"+
												"<div class='col-5 col-lg-6'>"+
													"<div class='related-event-img'>"+
														"<img src='"+imageUrl+"' />"+
													"</div>"+
													"<p class='related-events-date d-lg-none'>"+eventStartStr+" - "+eventEndStr+"</p>"+
												"</div>"+
												"<div class='col-7 col-lg-6  pl-xs-0'>"+
													"<div class='related-events-content'>"+
														"<p class='related-events-category'>"+EventTypeTitle+"</p>"+
														"<h3 class='related-events-title'>"+eventTitle+"</h3>"+
														"<p class='related-events-date d-none d-lg-block'>"+eventStartStr+" - "+eventEndStr+"</p>"+
													"</div>"+
												"</div>"+
											"</div>"+
										"</a>"+
									"</div>"+
								"</div>";
            $("#eventDetailContent").append(eventDetailHtml);
        }
	}
}

function loadMoreEventHideShow(){
	if(eventCollections.NextResultPosition==null || eventCollections.MainResultSet.length==0)
		$("#eventLoadMore").hide();
	else
		$("#eventLoadMore").show();
}

/////////////////////////////////////////////////////////////////////////////

function setLanguageData(){
	let finalSubUrl=_siteUrl+(isArabic?"/Pages/Ar/":"/Pages/");

	$("#publicaationTitle").text(isArabic?"منشورات مختارة":"Selected Publications");
	$("#allPublicationAnchor").text(isArabic?"جميع المنشورات":"All Publications");
	$("#allPublicationAnchor").attr("href",finalSubUrl+"Publication.aspx");

	$("#latestResearchTitle").text(isArabic?"أحدث مواضيع البحث":"Latest Research Themes");
	$("#allResearchUrl").attr("href",finalSubUrl+"ResearchTheme.aspx");

	$("#eventSectionTitle").text(isArabic?"الأحداث ذات الصلة":"Related Events");
	$("#AllEventAnchor").text(isArabic?"عرض جميع الأحداث":"View All Events");
	$("#AllEventAnchor").attr("href",finalSubUrl+"Events.aspx");

	$("#keyResearchSectionTitle").text(isArabic?"الباحثون الرئيسيون":"Key Researchers");
}

function bindLoadMore(){
	$("#publicationLoadMore").on("click",function(){
		if (pubCollections.NextResultPosition != null) {
			pubCamlQuery.set_listItemCollectionPosition(pubCollections.NextResultPosition);
			publistItems = publicationList.getItems(pubCamlQuery);
			ctx.load(publistItems);
			//Call the same function recursively until all the items in the current criteria are fetched.
			ctx.executeQueryAsync(function(){
				pubCollections.NextResultPosition=publistItems.get_listItemCollectionPosition();
				pubCollections.StartIndex=pubCollections.EndIndex;
				pubCollections.EndIndex=pubCollections.StartIndex+publistItems.get_count();
				fillPublicationItems();
			}, failure);
		}
	});

	$("#eventLoadMore").on("click",function(){
		if (eventCollections.NextResultPosition != null) {
			eventCamlQuery.set_listItemCollectionPosition(eventCollections.NextResultPosition);
			eventListItems = eventList.getItems(eventCamlQuery);
			ctx.load(eventListItems);
			ctx.executeQueryAsync(function(){
				eventCollections.NextResultPosition=eventListItems.get_listItemCollectionPosition();
				eventCollections.StartIndex=eventCollections.EndIndex;
				eventCollections.EndIndex=eventCollections.StartIndex+eventListItems.get_count();
				fillEventItems();
			}, failure);
		}
	});
}

function failure(err) {
    console.log(err);
}