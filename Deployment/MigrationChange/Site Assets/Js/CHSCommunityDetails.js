"use strict";
var _siteUrl = "";
var ItemID="";

$(document).ready(function () {
	document.title = "Staff Details";
	_siteUrl = _spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', communityDetailStart);
});

function communityDetailStart() {
    let finalUrl=isArabic?"/ar/pages/":"/Pages/";
    $("#AllCommunityUrl").attr("href",_siteUrl+finalUrl+"CHSCommunity.aspx");
    const urlParams = new URLSearchParams(window.location.search);
    ItemID = urlParams.get('ItemID')?urlParams.get('ItemID'):urlParams.get('itemid');
    if(ItemID){
        bindCommunityData();
        bindAuthorPublications();
        bindLoadMoreEvent();
    }
}

var listItem;
var communityTypeListItems;
var staffPositionListItems;
var currentItemDetails = {};
function bindCommunityData() {
    let ctx = SP.ClientContext.get_current();
    let listCollection = ctx.get_site().get_rootWeb().get_lists();
    let staffPositionList = listCollection.getByTitle(_listTitleStaffPosition);
    let communityTypeList = listCollection.getByTitle(_listTitleCommunityTypes);
    var allItemsQuery = SP.CamlQuery.createAllItemsQuery();

    communityTypeListItems = communityTypeList.getItems(allItemsQuery);
    staffPositionListItems = staffPositionList.getItems(allItemsQuery);

    listItem = ctx.get_site().get_rootWeb().get_lists().getByTitle(_listTitleCommunity).getItemById(ItemID);
    ctx.load(listItem);
    ctx.load(communityTypeListItems);
    ctx.load(staffPositionListItems);
    ctx.executeQueryAsync(function () {
        fillCommunityItems();
    }, failure);
}

function fillCommunityItems() {
    let communityType = [];
    for (let i = 0; i < communityTypeListItems.get_count(); i++) {
        let eachItem = communityTypeListItems.getItemAtIndex(i);
        let temp = {};
        temp.ID = eachItem.get_item('ID');
        temp.Title = eachItem.get_item('Title');
        temp.CommunityTypeArabic = eachItem.get_item('CommunityTypeArabic');
        communityType.push(temp);
    }

    let staffPositions = [];
    for (let i = 0; i < staffPositionListItems.get_count(); i++) {
        let eachItem = staffPositionListItems.getItemAtIndex(i);
        let temp = {};
        temp.ID = eachItem.get_item('ID');
        temp.Title = eachItem.get_item('Title');
        temp.StaffPositionArabic = eachItem.get_item('StaffPositionArabic');
        staffPositions.push(temp);
    }
    currentItemDetails.ID = listItem.get_item('ID');
    currentItemDetails.Title = isArabic ? listItem.get_item('StaffArabicTitle') : listItem.get_item('Title');
    currentItemDetails.StaffBiography = isArabic ? formatRichTextValue(listItem.get_item("StaffArabicBioGraphy")) : formatRichTextValue(listItem.get_item("StaffBiography"));
    currentItemDetails.ImageUrl = getImageSrcValue(listItem.get_fieldValues()['ImageUrl']);
    currentItemDetails.LinkedInUrl = listItem.get_item('LinkedInUrl')?listItem.get_item('LinkedInUrl').get_url():"";
    currentItemDetails.FacebookUrl = listItem.get_item('FacebookUrl')?listItem.get_item('FacebookUrl').get_url():"";
    currentItemDetails.TwitterLink = listItem.get_item('TwitterLink')?listItem.get_item('TwitterLink').get_url():"";
    currentItemDetails.UserEmail = listItem.get_item('UserEmail');
    currentItemDetails.PersonalWebsiteUrl = listItem.get_item('PersonalWebsiteUrl')?listItem.get_item('PersonalWebsiteUrl').get_url():"";
    currentItemDetails.StaffOtherPublications = isArabic ? formatRichTextValue(listItem.get_item("StaffOtherPublicationsAr")) : formatRichTextValue(listItem.get_item("StaffOtherPublications"));
    let staffPositionObj = listItem.get_item('StaffPositionLookup');
    if (staffPositionObj) {
        let staffLookupID = staffPositionObj.get_lookupId();
        let staffResults = $.grep(staffPositions, function (e) { return e.ID == staffLookupID; });
        if (staffResults.length > 0)
            currentItemDetails.StaffPositionLookup = { ID: staffResults[0].ID, "Title": isArabic ? staffResults[0].StaffPositionArabic : staffResults[0].Title };
    }
    let staffCommunityTypeObj = listItem.get_item('CommunityTypeID');
    if (staffCommunityTypeObj) {
        let staffCommunityTypeID = staffCommunityTypeObj.get_lookupId();
        let communityTypeResults = $.grep(communityType, function (e) { return e.ID == staffCommunityTypeID; });
        if (communityTypeResults.length > 0)
            currentItemDetails.CommunityType = { ID: communityTypeResults[0].ID, "Title": isArabic ? communityTypeResults[0].CommunityTypeArabic : communityTypeResults[0].Title };
    }

    currentItemDetails.PublicationHeading =isArabic?"المنشورات "+currentItemDetails.Title:"Publications By "+currentItemDetails.Title;
    currentItemDetails.OtherPublicationHeading =isArabic?"منشورات أخرى":"Other Publications";
    currentItemDetails.BioHeading =isArabic?"سيرة":"BioGraphy";

    fillCommunityHtml(pubCollections.MainResultSet, pubCollections.StartIndex, pubCollections.EndIndex);
}

function fillCommunityHtml() {
    $("#ItemTitle1,#ItemTitle2").text(currentItemDetails.Title);
    $("#StaffPosition").text(currentItemDetails.StaffPositionLookup.Title);

    $("#StaffBiography").html(currentItemDetails.StaffBiography);
    if(currentItemDetails.StaffOtherPublications)
        $("#StaffOtherPublications").html(currentItemDetails.StaffOtherPublications);
    else
        $("#team-other-publications").hide();

    if(currentItemDetails.ImageUrl)
        $("#ItemImage").attr("src", currentItemDetails.ImageUrl);
    else
        $("#ItemImage").hide();

    if(currentItemDetails.TwitterLink)
        $("#TwitterLink").attr("href", currentItemDetails.TwitterLink);
    else
        $("#TwitterLink").hide();

    if(currentItemDetails.LinkedInUrl)
        $("#LinkedInUrl").attr("href", currentItemDetails.LinkedInUrl);
    else
        $("#LinkedInUrl").hide();
    
    if(currentItemDetails.FacebookUrl)
        $("#FacebookUrl").attr("href", currentItemDetails.FacebookUrl);
    else
        $("#FacebookUrl").hide();

    if(currentItemDetails.UserEmail){
        $("#UserEmail").attr("href", "mailto:" + currentItemDetails.UserEmail);
        $("#UserEmail").text(currentItemDetails.UserEmail);
    }
    else
        $("#UserEmail").hide();

    $("#pubSectionTitle").text(currentItemDetails.PublicationHeading);
    $("#otherPubSectionTitle").text(currentItemDetails.OtherPublicationHeading);
    $("#bioHeading").text(currentItemDetails.BioHeading);

    //For sharing site
	let metaTitle=SlicingTitle(currentItemDetails.Title);
	let metaDesc=SlicingDesc($("#StaffBiography").text());
	let metaImageUrl=currentItemDetails.ImageUrl;
	$("head").append("<meta property='og:title' content='"+metaTitle+"'>");
	$("head").append("<meta property='og:description' content='"+metaDesc+"'>");
	$("head").append("<meta property='og:image' content='"+metaImageUrl+"'>");
	$("head").append("<meta name='twitter:card' content='"+metaDesc+"'>");
}

var ctx;
var pubList;
var pubCamlQuery;
var publistItems;
var pubTopicListItems;
var itemLimit=3;
var pubCollections={
	RetrieveResultsets:[],
	MainResultSet:[],
	NextResultPosition:0,
	StartIndex:0,
	EndIndex:0	
};
let authorPubItems;
function bindAuthorPublications(whereQuery) {
	pubCollections.RetrieveResultsets=[];
	pubCollections.MainResultSet=[];
	pubCollections.NextResultPosition="";
	pubCollections.StartIndex=0;
    pubCollections.EndIndex=0;
    
    ctx = SP.ClientContext.get_current();
    pubList = ctx.get_site().get_rootWeb().get_lists().getByTitle(_listTitlePublication);
    let pubTopicList = ctx.get_site().get_rootWeb().get_lists().getByTitle(_listTitlePublicationTopics);
	pubCamlQuery = new SP.CamlQuery();
	let query = "<View><Query><OrderBy><FieldRef Name='IsFeatured1' Ascending='False'/><FieldRef Name='Modified' Ascending='False'/></OrderBy>";
    query += "<Where><Eq><FieldRef Name='PublicationAuthorIDs' LookupId='True' />";
    query += "<Value Type='Integer'>" + ItemID + "</Value>";
    query += "</Eq></Where>";
    query += "</Query><RowLimit>"+itemLimit+"</RowLimit></View>";
    pubCamlQuery.set_viewXml(query);
    publistItems = pubList.getItems(pubCamlQuery);
    pubTopicListItems=pubTopicList.getItems(SP.CamlQuery.createAllItemsQuery());
    ctx.load(publistItems);
    ctx.load(pubTopicListItems);
	ctx.executeQueryAsync(function(){
		pubCollections.StartIndex=0;
		pubCollections.EndIndex=publistItems.get_count();
		pubCollections.NextResultPosition=publistItems.get_listItemCollectionPosition();
		loadMoreHideShow();
		fillPublicationItems();
    },failure);
}

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
    loadMoreHideShow();
}

function fillPublicationHtml(resultSet,startIndex,endIndex){
    if(resultSet.length==0)
        $("#team-selected-publications").hide();
    else{
        for (let i = startIndex; i < endIndex; i++) {
            let eachPublication = resultSet[i];
    
            let pubTitle = eachPublication.Title;
            let publicationDetailUrl = _siteUrl +(isArabic?"/ar/pages/":"/Pages/")+"PublicationDetails.aspx?ItemID=" + eachPublication.ID;
            let pubCategory = eachPublication.PublicationTopicIDs.Title;
            let pubDetails = eachPublication.PublicationDetails;
            let contentHtml = "<div class='col-lg-4'>"+
                                "<div class='publication'>"+
                                    "<div class='publication-content'>"+
                                        "<p class='publication-category'>"+pubCategory+"</p>"+
                                        "<a href='"+publicationDetailUrl+"'>"+
                                            "<h3 class='publication-title'>"+pubTitle+"</h3>"+
                                        "</a>"+
                                        "<p class='publication-text'>"+pubDetails+"</p>"+
                                    "</div>"+
                                "</div>"+
                            "</div>";
            $("#publicationContent").append(contentHtml);
        }
    }
}

function bindLoadMoreEvent(){
	$("#publicationLoadMore").on("click",function(){
		if (pubCollections.NextResultPosition != null) {
			pubCamlQuery.set_listItemCollectionPosition(pubCollections.NextResultPosition);
			publistItems = pubList.getItems(pubCamlQuery);
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
}
function loadMoreHideShow(){
	if(pubCollections.NextResultPosition==null || pubCollections.MainResultSet.length==0)
		$("#publicationLoadMore").hide();
	else
		$("#publicationLoadMore").show();
}

