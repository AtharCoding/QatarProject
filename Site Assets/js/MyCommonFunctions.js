var _listTitleBlogs = "Blogs";
var _listTitleEvents = "Events";
var _listTitlePublication = "Publications";
var _listTitleResearch = "ResearchThemes";
var _listTitleCommunity = "CHS Community";
var _listTitleCommunityTypes = "CommunityType";
var _listTitleStaffPosition="StaffPositions";
var _listTitleNews = "News";
var _listTitleBusinessPartner = "BusinessPartner";
var _listTitleAboutUs = "AboutUs";
var _listTitleCHSCommunity = "CHS Community";
var _listTitleGuidingPrinciple = "GuideLinePrinciple";
var _listTitleAboutExplore = "AboutExplore";
var _listContact="ContactUs";
var _listWebsite="WebsiteConnect";
var _listEmailSubscribers="EmailSubscribers";
var _listTermsOfUse="TermsOfUse";
var _listTitlePagesDetails="PagesDetails";
var _listTitlePublicationTopics="PublicationTopics";
var _listTitleEventTypes="EventTypes";
var _listTitleHomeSmallBanner="HomeSmallBaner";
var _listTitleHomeExtraContent="HomeExtraContent";

var isArabic=false;
if (window.location.href.toLowerCase().indexOf("/ar/") > -1)
	isArabic=true;

let charLimitTitle = 50;
let charLimitDesc = 200;
let charLimitProfile = 100;

function commonForAllPages(){
	let breadItems=$(".breadcrumb .breadcrumb-item:not(.active) a");
	if(isArabic){
		$(".readMore").text("قراءة المزيد");
		$(".load-more").text("تحميل المزيد");
		breadItems.each(function(index,item){
			let itemText=$(item).text();
			if(itemText=="Home")
				$(item).text("بيت");
			if(itemText=="CHS Community")
				$(item).text("CHS الجماعة");
			if(itemText=="Research Themes")
				$(item).text("مواضيع البحث");
			if(itemText=="Publications")
				$(item).text("المنشورات");
			if(itemText=="Blogs")
				$(item).text("المدونات");
			if(itemText=="News")
				$(item).text("أخبار");
			if(itemText=="Events")
				$(item).text("الأحداث");
		});
	}
	else{
		$(".load-more").text("LOAD MORE");
		$(".readMore").text("Read more");
	}
}

function getFormattedDate(supplyDateTime) {
	const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
	let current_datetime = new Date(supplyDateTime);
	var formatted_date = ('0' + current_datetime.getDate()).slice(-2) + " " + months[current_datetime.getMonth()] + " " + current_datetime.getFullYear();
	return formatted_date;
}

function getListDetails(listTitle){
	var ctx = SP.ClientContext.get_current();
	var list = ctx.get_site().get_rootWeb().get_lists().getByTitle(_listTitlePagesDetails);
	var camlQuery = new SP.CamlQuery();
	let query = "<View><Query>";
	query += "<Where><Eq><FieldRef Name='Title' />";
	query += "<Value Type='Text'>"+listTitle+"</Value>";
	query += "</Eq></Where>";
	query += "</Query><RowLimit>"+1+"</RowLimit></View>";
	camlQuery.set_viewXml(query);
	let listItems = list.getItems(camlQuery);
	ctx.load(listItems);
	ctx.executeQueryAsync(function(){
		let itemsCount=listItems.get_count();
		let resultTitle="";
		let resultDesc="";
		if(itemsCount>0){
			let eachItem = listItems.getItemAtIndex(0);
			if (window.location.href.toLowerCase().indexOf("/ar/") > -1) {

				resultTitle = eachItem.get_item('ListArabicTitle');
				resultDesc = eachItem.get_item('ListArabicDesc');
			}
			else{
				resultTitle = eachItem.get_item('ListEnglishTitle');
				resultDesc = eachItem.get_item('ListEnglishDesc');
			}
			$("#contentListTitle,.breadcrumb .breadcrumb-item.active").text(resultTitle);
			$("#contentListDesc").text(resultDesc);
		}
	},function(err){
		console.error(err);
	});
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
	return result;
}
function formatRichTextValue(richValue) {
	let result="";
	if(richValue)
		result =$(richValue).html().replace(/font-size:[^;]+/g, '').replace(/font-family:[^;]+/g, '').replace(/<p><\/p>/g, "").replace(/<p><br><\/p>/g, "");
		result=result.replace(/<div>/g,"<p>").replace(/<\/div>/g,"</p>");
	return result;
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
function isValidEmailAddress(emailAddress) {
    var pattern = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
    return pattern.test(emailAddress);
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
	if(srcStr)
		return srcStr.slice(0, charLimitTitle);
	else
		return "";
}

function SlicingDesc(srcStr) {
	if(srcStr)
		return srcStr.slice(0, charLimitDesc);
	else
		return "";
}

function failure(sender, args){
	console.log('Request Failed. ' + args.get_message() + '\n' + args.get_stackTrace());
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
	let owlCarouselData=$('.owl-carousel').data('owl.carousel');
	if(owlCarouselData)
		owlCarouselData.destroy();
		
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
							eachStaff.ProfileDetailPageURL = _siteUrl + "/Pages/CHSCommunityDetails.aspx?ItemID=" + eachStaff.ID;
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

function generateCamlQuery(condition,type){
	if(condition.length==0) return "";
	let typeStart=type.toLowerCase()=="and"?"<And>":"<Or>";
	let typeEnd=type.toLowerCase()=="and"?"</And>":"</Or>";

	while(condition.length>=2){
		let complexCondition=[];

		for(let i=0;i<condition.length;i+=2){
			if(condition.length==i+1)
				complexCondition.push(condition[i]);
			else
				complexCondition.push(typeStart+condition[i]+condition[i+1]+typeEnd);
		}
		condition =complexCondition;
	}
	return condition[0];
}
function createCamlQueryByIDArr(staffIDArr){
	let query=SP.CamlQuery.createAllItemsQuery();
	if(staffIDArr.length>0){
		query = "<View><Query><OrderBy><FieldRef Name='Modified'/></OrderBy>";
		query += "<Where><In><FieldRef Name='ID' /><Values>";
		staffIDArr.forEach(function (id) {
			query += '<Value Type="Number">' + id + '</Value>';
		});
		query += '</Values></In></Where></Query></View>';
	}
	return query;
}

let staffCollection = [];
function getStaffDetailsByQuery(camlQueryText, otherObject, onComplete, onFailure) {
	let ctx = SP.ClientContext.get_current();
	let listCollection = ctx.get_site().get_rootWeb().get_lists();

	let communityList = listCollection.getByTitle(_listTitleCommunity);
	let staffPositionList = listCollection.getByTitle(_listTitleStaffPosition);
	let communityTypeList = listCollection.getByTitle(_listTitleCommunityTypes);
	var allItemsQuery = SP.CamlQuery.createAllItemsQuery();

	let camlQuery = new SP.CamlQuery();
	camlQuery.set_viewXml(camlQueryText);

	let communityTypeListItems = communityTypeList.getItems(allItemsQuery);
	let staffPositionListItems = staffPositionList.getItems(allItemsQuery);
	let communityListItems = communityList.getItems(camlQuery);
	ctx.load(communityTypeListItems);
	ctx.load(staffPositionListItems);
	ctx.load(communityListItems);
	ctx.executeQueryAsync(function () {
		if (communityListItems.get_count() > 0) {
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
			for (let i = 0; i < communityListItems.get_count(); i++) {
				let eachItem = communityListItems.getItemAtIndex(i);

				let eachStaff = {};
				eachStaff.ID = eachItem.get_item('ID');
				eachStaff.ProfileDetailPageURL = _siteUrl + (isArabic?"/ar/pages/":"/Pages/")+"CHSCommunityDetails.aspx?ItemID=" + eachItem.get_item('ID');
				eachStaff.ImageUrl = getImageSrcValue(eachItem.get_fieldValues()['ImageUrl']);
				eachStaff.PersonalWebsiteUrl = eachItem.get_item('PersonalWebsiteUrl');
				eachStaff.LinkedInUrl = eachItem.get_item('LinkedInUrl');
				eachStaff.FacebookUrl = eachItem.get_item('FacebookUrl');
				eachStaff.TwitterLink = eachItem.get_item('TwitterLink');
				eachStaff.UserEmail = eachItem.get_item('UserEmail');
				eachStaff.Title = isArabic ? eachItem.get_item('StaffArabicTitle') : eachItem.get_item('Title');
				eachStaff.StaffBiography = isArabic ? eachItem.get_item('StaffArabicBioGraphy') : eachItem.get_item('StaffBiography');

				let staffPositionObj = eachItem.get_item('StaffPositionLookup');
				if (staffPositionObj) {
					let staffLookupID = staffPositionObj.get_lookupId();
					let staffResults = $.grep(staffPositions, function (e) { return e.ID == staffLookupID; });
					if (staffResults.length > 0)
						eachStaff.StaffPositionLookup = { ID: staffResults[0].ID, "Title": isArabic ? staffResults[0].StaffPositionArabic:staffResults[0].Title};
				}
				let staffCommunityTypeObj = eachItem.get_item('CommunityTypeID');
				if (staffCommunityTypeObj) {
					let staffCommunityTypeID = staffCommunityTypeObj.get_lookupId();
					let communityTypeResults = $.grep(communityType, function (e) { return e.ID == staffCommunityTypeID; });
					if (communityTypeResults.length > 0)
						eachStaff.CommunityType = { ID: communityTypeResults[0].ID, "Title": isArabic ?communityTypeResults[0].CommunityTypeArabic:communityTypeResults[0].Title };
				}
				staffCollection.push(eachStaff);
			}
			onComplete(staffCollection, otherObject);
		}
		else
			onComplete(staffCollection, otherObject);
	}, onFailure);
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