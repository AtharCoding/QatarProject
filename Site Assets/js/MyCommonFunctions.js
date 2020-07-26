var _listTitleBlogs = "Blogs";
var _listTitleEvents = "Events";
var _listTitlePublication = "Publications";
var _listTitleResearch = "ResearchThemes";
var _listTitleCommunity = "CHS Community";
var _listTitleNews = "News";
var _listTitleBusinessPartner = "BusinessPartner";

let charLimitTitle = 50;
let charLimitDesc = 350;
let charLimitProfile = 100;
function getFormattedDate(supplyDateTime) {
	const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
	let current_datetime = new Date(supplyDateTime);
	var formatted_date = ('0' + current_datetime.getDate()).slice(-2) + " " + months[current_datetime.getMonth()] + " " + current_datetime.getFullYear();
	return formatted_date;
}

function getFormattedTime(dateStr) {
	let date = new Date(dateStr);
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var ampm = hours >= 12 ? 'pm' : 'am';
	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'
	minutes = minutes < 10 ? '0' + minutes : minutes;
	hours = hours < 10 ? '0' + hours : hours;
	var strTime = hours + ':' + minutes + ' ' + ampm;
	return strTime;
}

function getSizeStr(byteValue) {
	let result = byteValue + "Bytes";
	if (byteValue > (1e+10))
		result = (byteValue / (1e+9)) + "GB";
	else if (byteValue > 1e+7)
		result = (byteValue / (1e+6)) + "MB";
	else if (byteValue > 1e+4)
		result = (byteValue / (1e+3)) + "KB";
}
function formatRichTextValue(richValue) {
	return $(richValue).html().replace(/font-size:[^;]+/g, '').replace(/font-family:[^;]+/g, '').replace("<p></p>", "");
}

var CalenderDetailObj = {
	Title: "",
	Description: "",
	Place: "",
	BeginDateTime: "",
	EndDateTime: ""
}
function getCalenderICSFile(CalenderDetailObj) {
	var calEntry = icsFormatter();
	var title = CalenderDetailObj.Title;
	var description = CalenderDetailObj.Description;
	var place = CalenderDetailObj.Place;
	var begin = new Date(CalenderDetailObj.BeginDateTime);
	var end = new Date(CalenderDetailObj.EndDateTime);
	calEntry.addEvent(title, description, place, begin.toUTCString(), end.toUTCString());
	calEntry.download('ourSecretMeeting');
}

function getImageSrcValue(imgTag) {
	var src = '';
	if (imgTag) {
		var regex = /<img.*?src="(.*?)"/;
		src = (regex.exec(imgTag) !== null) ? regex.exec(imgTag)[1] : '';
		src = (src.indexOf("?") > 0) ? src.substring(0, src.indexOf("?")) : src;
	}
	return src;
}

function getImageUrl(item, index, success, fail) {
	let embedImgUrl = item.FieldValuesAsHtml.__deferred.uri;
	var itemImgUrl = SPRestCommon.GetItemAjaxCall(embedImgUrl);
	$.when(itemImgUrl)
		.then(function (itemImgResult) {
			var imageData = itemImgResult.d.ImageUrl;
			var actualImgUrl = getImageSrcValue(imageData);
			success(actualImgUrl, item, index);
		}).fail(function (err) { fail(err); });
}

function SlicingTitle(srcStr) {
	return srcStr.slice(0, charLimitTitle)
}

function SlicingDesc(srcStr) {
	return srcStr.slice(0, charLimitDesc)
}

function SlicingProfileDesc(srcStr) {
	return srcStr.slice(0, charLimitProfile)
}

function pagingFunctionalityIncomplete(itemsCount, pageLimit) {
	let pagesCount = Math.ceil(itemsCount / pageLimit);
	let finalHtml = "";
	for (let i = 1; i <= pagesCount; i++) {
		if (i == 1)
			finalHtml += "<li class='page-item active'><a class='page-link' href='#'>" + i + "</a></li>";
		else if (i == 2 || i == 3 || (i == 4 && i == pagesCount))
			finalHtml += "<li class='page-item'><a class='page-link' href='#'>" + i + "</a></li>";
		else if (i == 4 && i == pagesCount)
			finalHtml += "<li class='page-item'><a class='page-link' href='#'>" + i + "</a></li>";
	}
}

function createOwlSlider() {
	$(".owl-carousel").owlCarousel({
		loop: false,
		margin: 30,
		nav: true,
		rtl: false,
		navText: [
			'<span class="nav-prev"><i class="fal fa-chevron-left"></i></span>',
			'<span class="nav-next"><i class="fal fa-chevron-right"></i></span>',
		],
		responsive: {
			0: {
				items: 1,
				nav: false,
			},
			600: {
				items: 3,
			},
			1000: {
				items: 6,
			},
		},
	});
}

function getMonthRange(inputDate, onComplete) {
	var y = inputDate.getFullYear();
	var m = inputDate.getMonth();
	var monthStartDate = getFormattedDate(new Date(y, m, 1));
	var monthEndDate = getFormattedDate(new Date(y, m + 1, 0));
	onComplete(monthStartDate, monthEndDate);
}

function getWeekRange(inputDate, onComplete) {
	var first = inputDate.getDate() - inputDate.getDay();
	var last = first + 6;
	var firstday = new Date(inputDate.setDate(first)).toUTCString();
	var lastday = new Date(inputDate.setDate(last)).toUTCString();
	var weekStartDate = getFormattedDate(firstday);
	var weekEndDate = getFormattedDate(lastday);
	onComplete(weekStartDate, weekEndDate);
}

var staffCollectionResult = [];
var tempStaffCollection = [];
var staffCounter = 0;
function getStaffByCommaSaperateIDs(commaSaperateIDs, otherObject, onComplete) {
	if (commaSaperateIDs) {
		let staffIDs = commaSaperateIDs.split(",").filter(function (i) { return i });
		let filterStr = "ID eq " + staffIDs.join(" or ID eq ");

		var urlForStaffResearch = _siteUrl + "/_api/web/lists/GetByTitle('" + _listTitleCommunity + "')/items?$filter=" + filterStr + "&$orderby=Modified desc";
		var get_StaffResearch = SPRestCommon.GetItemAjaxCall(urlForStaffResearch);

		$.when(get_StaffResearch)
			.then(function (respStaffResearch) {
				tempStaffCollection = respStaffResearch.d.results;
				if (tempStaffCollection.length > 0) {
					for (let i = 0; i < tempStaffCollection.length; i++) {
						getImageUrl(tempStaffCollection[i], i, function (resultImgUrl, eachStaff, otherObject) {
							staffCounter++;
							eachStaff.ProfileDetailPageURL = _siteUrl + "/Pages/CHSCommunityDetails.aspx?ID=" + eachStaff.ID;
							eachStaff.ProfileImageUrl = resultImgUrl;
							staffCollectionResult.push(eachStaff);
							if (staffCounter == tempStaffCollection.length)
								onComplete(staffCollectionResult, otherObject);
						});
					}
				}
				else
					onComplete(staffCollectionResult, otherObject);
			});
	}
	else
		onComplete(staffCollectionResult, otherObject);
}

let staffCollection=[];
function getStaffByIDArray(ctx,staffIDArr, otherObject, onComplete, onFailure) {
	if (staffIDArr.length > 0) {
		let list = ctx.get_web().get_lists().getByTitle(_listTitleCommunity);
		let camlQuery = new SP.CamlQuery();
		let query = "<View><Query><OrderBy><FieldRef Name='Modified'/></OrderBy>";
		query += "<Where><In><FieldRef Name='ID' /><Values>";
		staffIDArr.forEach(function (id) {
			query += '<Value Type="Number">' + id + '</Value>';
		});
		query += '</Values></In></Where></Query></View>';
		camlQuery.set_viewXml(query);
		
		let items = list.getItems(camlQuery);
		ctx.load(items);
		ctx.executeQueryAsync(function(){			
			if (items.get_count() > 0) {
				for (let i = 0; i <items.get_count(); i++) {
					let eachStaff={};
					let eachItem = items.getItemAtIndex(i);

					let resultImgUrlTag=eachItem.get_fieldValues()['ImageUrl'];
					if(resultImgUrlTag){
						let resultImgUrl=getImageSrcValue(resultImgUrlTag);
						eachStaff.ProfileDetailPageURL = _siteUrl + "/Pages/CHSCommunityDetails.aspx?ID=" + eachItem.get_item('ID');
						eachStaff.ProfileImageUrl = resultImgUrl;
						eachStaff.Title = eachItem.get_item('Title');
						eachStaff.StaffPostion = eachItem.get_item('StaffPostion');
						eachStaff.ID = eachItem.get_item('ID');
						staffCollection.push(eachStaff);
					}
				}
				onComplete(staffCollection, otherObject);
			}
			else
				onComplete(staffCollection, otherObject);
		},onFailure);
	}
	else
		onComplete(staffCollection, otherObject);
}

var partnerCollectionResult = [];
var tempPartnerCollection = [];
var partnerCounter = 0;
function getPartnerByCommaSaperateIDs(commaSaperateIDs, otherObject, onComplete) {
	if (commaSaperateIDs) {
		let partnerIDs = commaSaperateIDs.split(",").filter(function (i) { return i });
		let filterStr = "ID eq " + partnerIDs.join(" or ID eq ");

		var urlForPartnerResearch = _siteUrl + "/_api/web/lists/GetByTitle('" + _listTitleBusinessPartner + "')/items?$filter=" + filterStr + "&$orderby=Modified desc";
		var get_PartnerResearch = SPRestCommon.GetItemAjaxCall(urlForPartnerResearch);

		$.when(get_PartnerResearch)
			.then(function (respPartnerResearch) {
				tempPartnerCollection = respPartnerResearch.d.results;
				if (tempPartnerCollection.length > 0) {
					for (let i = 0; i < tempPartnerCollection.length; i++) {
						getImageUrl(tempPartnerCollection[i], i, function (resultImgUrl, eachPartner, otherObject) {
							partnerCounter++;
							eachPartner.PhotoUrl = resultImgUrl;
							partnerCollectionResult.push(eachPartner);
							if (partnerCounter == tempPartnerCollection.length)
								onComplete(partnerCollectionResult, otherObject);
						});
					}
				}
				else
					onComplete(partnerCollectionResult, otherObject);
			});
	}
	else
		onComplete(partnerCollectionResult, otherObject);
}