"use strict";
var _siteUrl = "";

var ctx;
var communityCamlQuery;
var listItems;
var itemLimit = 1000;
var communityCollections = {
	RetrieveResultsets: [],
	MainResultSet: [],
	NextResultPosition: 0,
	StartIndex: 0,
	EndIndex: 0
};
var isRefreshData = false;
var descCharLimit=160;

$(document).ready(function () {
	document.title = "CENTER FOR CONFLICT AND HUMANITARIAN STUDIES";
	_siteUrl =_spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', communityStart);
});

function communityStart() {
	getListDetails(_listTitleCommunity);
	bindCommunityData("");
}

function bindCommunityData(whereQuery) {
	if (isRefreshData)
		$("#communityContent").html("");

	communityCollections.RetrieveResultsets = [];
	communityCollections.MainResultSet = [];
	communityCollections.NextResultPosition = "";
	communityCollections.StartIndex = 0;
	communityCollections.EndIndex = 0;

	let query = "<View><Query><OrderBy><FieldRef Name='IsFeatured1' Ascending='False' /><FieldRef Name='Modified' Ascending='False'/></OrderBy>";
	if (whereQuery)
		query += whereQuery;
	query += "</Query><RowLimit>" + itemLimit + "</RowLimit></View>";
	getStaffDetailsByQuery(query, 0, function (staffCollection) {
		listItems = staffCollection;
		communityCollections.StartIndex = 0;
		communityCollections.EndIndex = staffCollection.length;
		communityCollections.NextResultPosition = 0;
		fillCommunityItems();
	}, failure);
}

function fillCommunityItems() {
	for (let i = 0; i < listItems.length; i++) {
		let eachCommunity = listItems[i];
		let tempObj = {};
		tempObj.Index = i;
		tempObj.ID = eachCommunity.ID;
		tempObj.Title = SlicingTitle(eachCommunity.Title);
		tempObj.StaffPositionLookup = eachCommunity.StaffPositionLookup;
		tempObj.StaffBiography = $("<div></div>").append(eachCommunity.StaffBiography).text().slice(0, descCharLimit);
		tempObj.CommunityType = eachCommunity.CommunityType;
		tempObj.FacebookUrl = eachCommunity.FacebookUrl;
		tempObj.LinkedInUrl = eachCommunity.LinkedInUrl;
		tempObj.PersonalWebsiteUrl = eachCommunity.PersonalWebsiteUrl;
		tempObj.TwitterLink = eachCommunity.TwitterLink;
		tempObj.UserEmail = eachCommunity.UserEmail;
		tempObj.ImageUrl = eachCommunity.ImageUrl;
		tempObj.ProfileDetailPageURL=eachCommunity.ProfileDetailPageURL;

		communityCollections.RetrieveResultsets.push(tempObj);
		communityCollections.RetrieveResultsets.sort(function (a, b) { return a.Index - b.Index; });
		let mainLength = communityCollections.MainResultSet.length;
		if (mainLength > 0) {
			$.each(communityCollections.RetrieveResultsets, function () {
				this.Index = mainLength + this.Index;
			});
		}
		communityCollections.MainResultSet = communityCollections.MainResultSet.concat(communityCollections.RetrieveResultsets);
		communityCollections.RetrieveResultsets = [];
	}
	fillCommunityHtml(communityCollections.MainResultSet, communityCollections.StartIndex, communityCollections.EndIndex);
}

function unique(a) {
	var isAdded,
		arr = [];
	for (var i = 0; i < a.length; i++) {
		isAdded = arr.some(function (v) {
			return isEqual(v, a[i]);
		});
		if (!isAdded) {
			arr.push(a[i]);
		}
	}
	return arr;
}
function isEqual(a, b) {
	var prop;
	for (prop in a) {
		if (a[prop] !== b[prop]) return false;
	}
	for (prop in b) {
		if (b[prop] !== a[prop]) return false;
	}
	return true;
}

function fillCommunityHtml(resultSet, startIndex, endIndex) {
	var communityTypeCollection = $(resultSet).map(function () { return this.CommunityType; });
	let uniqueCommunityTypes = unique(communityTypeCollection);
	for (let i = 0; i < uniqueCommunityTypes.length; i++) {
		let activeClass = i == 0 ? "active" : "";

		let communityType = uniqueCommunityTypes[i];
		let commnityTypeId = communityType.ID;
		let communityTypeName = communityType.Title;
		let tabcontentUpperDiv = "<div class='tab-pane fade show " + activeClass + "' id='pills-" + commnityTypeId + "' role='tabpanel' aria-labelledby='pills-" + commnityTypeId + "-tab'>" +
			"<div class='row row-cols-1 row-cols-lg-5 grid-flex' id='tabContent" + commnityTypeId + "'>" +
			"</div>" +
			"</div>";
		$("#pills-tabContent").append(tabcontentUpperDiv);
		let tabTitleDiv = "<li class='nav-item' role='presentation'>" +
			"<a class='nav-link " + activeClass + "' id='community-tab-" + commnityTypeId + "' data-toggle='pill' href='#pills-" + commnityTypeId + "' role='tab'" +
			"aria-controls='pills-" + commnityTypeId + "' aria-selected='true'>" + communityTypeName + "</a>" +
			"</li>";
		$("#community-tab").append(tabTitleDiv);
	}
	for (let i = startIndex; i < endIndex; i++) {
		let eachCommunity = resultSet[i];
		let staffDetailUrl = eachCommunity.ProfileDetailPageURL;
		let StaffBiography = eachCommunity.StaffBiography;
		let staffTitle = eachCommunity.Title;
		let staffImageUrl = eachCommunity.ImageUrl;
		let FacebookUrl = eachCommunity.FacebookUrl;
		let LinkedInUrl = eachCommunity.LinkedInUrl;
		let PersonalWebsiteUrl = eachCommunity.PersonalWebsiteUrl;
		let TwitterLink = eachCommunity.TwitterLink;
		let UserEmail = eachCommunity.UserEmail;
		let communityTypeID = eachCommunity.CommunityType ? eachCommunity.CommunityType.ID : "";
		let staffPosition = eachCommunity.StaffPositionLookup ? eachCommunity.StaffPositionLookup.Title : "";
		let contentHtml = "<div class='col'>" +
			"<div class='team'>" +
			"<div class='team-img'>" +
			"<a href='" + staffDetailUrl + "'>" +
			"<img src='" + staffImageUrl + "' />" +
			"</a>" +
			"</div>" +
			"<div class='team-content'>" +
			"<a href='" + staffDetailUrl + "'>" +
			"<h3>" + staffTitle + "</h3>" +
			"</a>" +
			"<h4>" + staffPosition + "<a href='" + LinkedInUrl + "' target='_blank' class='linkedin'>" +
			"<i class='fab fa-linkedin-in'></i></a></h4>" +
			"<p>" + StaffBiography + "</p>" +
			"</div>" +
			"</div>" +
			"</div>";
		$("#tabContent" + communityTypeID).append(contentHtml);
	}
}

function failure(err) {
	console.log(err);
}

