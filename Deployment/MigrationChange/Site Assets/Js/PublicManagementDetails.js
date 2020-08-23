"use strict";
var _siteUrl = "";
let ItemID="";
var ctx;

var currentListItem;
var currentItemDetails={};
var publicMgtAuthorIDs=[];

var publicMgtLatestItems="";
var latestPublicMgtItemLimit=4;
var latestPublicMgtCollections=[];

$(document).ready(function () {
	document.title = "Public Management Details";
	_siteUrl = _spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', publicMgtDetailStart);
});

function publicMgtDetailStart() {
	setLanguageData();
    const urlParams = new URLSearchParams(window.location.search);
    ItemID = urlParams.get('ItemID')?urlParams.get('ItemID'):urlParams.get('itemid');
    if(ItemID){
        bindPublicMgtData();
    }
}

function bindPublicMgtData() {
    ctx = new SP.ClientContext();
    let listCollection = ctx.get_site().get_rootWeb().get_lists();
	let publicMgtList = listCollection.getByTitle(_listTitlePublicManagement);

	let latestPublicMgtQuery = new SP.CamlQuery();
	let latestPublicMgtText = "<View><Query><OrderBy><FieldRef Name='IsFeatured1' Ascending='False' /><FieldRef Name='Modified' Ascending='False'/></OrderBy>";
	latestPublicMgtText += "</Query><RowLimit>" + latestPublicMgtItemLimit + "</RowLimit></View>";
	latestPublicMgtQuery.set_viewXml(latestPublicMgtText);
	publicMgtLatestItems = publicMgtList.getItems(latestPublicMgtQuery);
	currentListItem = publicMgtList.getItemById(ItemID);

	ctx.load(publicMgtLatestItems);
	ctx.load(currentListItem);
	
    ctx.executeQueryAsync(function () {
		fillPublicMgtItem();
    }, failure);
}

function fillPublicMgtItem() {
    currentItemDetails.ID = currentListItem.get_item('ID');
    currentItemDetails.Title = isArabic ? currentListItem.get_item('ManagementArabicTitle') : currentListItem.get_item('Title');
    currentItemDetails.PublicMgtContent = isArabic ? formatRichTextValue(currentListItem.get_item("ManagementArabicContent")) : formatRichTextValue(currentListItem.get_item("ManagementContent"));
	currentItemDetails.ImageUrl = getImageSrcValue(currentListItem.get_fieldValues()['ImageUrl']);
	let publicMgtAuthorCollection = currentListItem.get_item("ContentWriterName");
	for(var i = 0;i < publicMgtAuthorCollection.length;i++) {
		publicMgtAuthorIDs.push(publicMgtAuthorCollection[i].get_lookupId());
	}
	fillPublicMgtHtml();
	fillPublicMgtAuthorHtml();

	for (let i = 0; i < publicMgtLatestItems.get_count(); i++) {
		let eachItem = publicMgtLatestItems.getItemAtIndex(i);
		let eachPublicMgt = {};

		eachPublicMgt.ID = eachItem.get_item('ID');
		eachPublicMgt.Title = isArabic ? eachItem.get_item('ManagementArabicTitle') : eachItem.get_item('Title');
		eachPublicMgt.PublicMgtDetailPageURL = _siteUrl + (isArabic ? "/ar/pages/" : "/Pages/") + "PublicMgtDetails.aspx?ItemID=" + eachItem.get_item('ID');
		eachPublicMgt.ImageUrl = getImageSrcValue(eachItem.get_fieldValues()['ImageUrl']);
		eachPublicMgt.publicMgtContent = isArabic ? eachItem.get_item('ManagementArabicContent') : eachItem.get_item('ManagementContent');
		latestPublicMgtCollections.push(eachPublicMgt);
	}
	fillLatestPublicMgtHtml();
}

function fillPublicMgtHtml() {
	$("#currentTitleNav,#currentTitleHeading,#currentTitleBlock").text(currentItemDetails.Title);
	$("#currentReasearchContent").html(currentItemDetails.PublicMgtContent);

	//For sharing site
	let metaTitle=SlicingTitle(currentItemDetails.Title);
	let metaDesc=SlicingDesc($("<div></div>").append(currentItemDetails.PublicMgtContent).text());
	let metaImageUrl=currentItemDetails.ImageUrl;
	$("head").append("<meta property='og:title' content='"+metaTitle+"'>");
	$("head").append("<meta property='og:description' content='"+metaDesc+"'>");
	$("head").append("<meta property='og:image' content='"+metaImageUrl+"'>");
	$("head").append("<meta name='twitter:card' content='"+metaDesc+"'>");
}

function fillPublicMgtAuthorHtml() {
	if(publicMgtAuthorIDs.length==0)
		$("#key-researchers").hide();
	else{
		let queryText=createCamlQueryByIDArr(publicMgtAuthorIDs);
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

function fillLatestPublicMgtHtml() {
	for (let i = 0; i < latestPublicMgtCollections.length; i++) {
		let eachPublicMgt = latestPublicMgtCollections[i];
		var eachPublicMgtTitle="<div class='related-list-item'>"+
									"<a href='"+eachPublicMgt.PublicMgtDetailPageURL+"'>"+
										"<p class='related-title'>"+eachPublicMgt.Title+"</p>"+
									"</a>"+
								"</div>";
		$("#latestPublicMgt").append(eachPublicMgtTitle);
	}
}

function setLanguageData(){
	let finalSubUrl=_siteUrl+(isArabic?"/ar/pages/":"/Pages/");

	$("#latestPublicMgtTitle").text(isArabic?"أحدث مواضيع البحث":"Latest Contents");
	$("#allPublicMgtUrl").attr("href",finalSubUrl+"PublicManagement.aspx");

	$("#keyPublicMgtSectionTitle").text(isArabic?"الباحثون الرئيسيون":"Content Writers");
}