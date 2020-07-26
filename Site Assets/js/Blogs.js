"use strict";
var _siteUrl = "";
var _blogsCollection = [];
var _interviewCollection = [];
var _articleCollection = [];
var _blogListDetails = [];
var interviewActiveIndex = 3;
var articleActiveIndex = 3;

var _blogDetails = [];
var _articleDetails = [];
var _interviewDetails = [];
$(document).ready(function () {
	document.title = "Blogs";
	_siteUrl = _spPageContextInfo.webAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', blogsStart);
});

function blogsStart() {
	var urlForBlogList = _siteUrl + "/_api/web/lists/GetByTitle('" + _listTitleBlogs + "')";
	var get_BlogList = SPRestCommon.GetItemAjaxCall(urlForBlogList);

	var urlForBlogs = _siteUrl + "/_api/web/lists/GetByTitle('" + _listTitleBlogs + "')/items?" +
		"$select=ID,Title,ContentDate,BlogContent,IsFeatured1,IsVideo,ContentWriterName/Title,ContentWriterName/ID,NoOfViews,Tag,BlogType,VideoUrl,FieldValuesAsHtml" +
		"&$expand=ContentWriterName" +
		"&$top=1000&$orderby=IsVideo desc,Modified desc";
	var get_Blogs = SPRestCommon.GetItemAjaxCall(urlForBlogs);

	$.when(get_BlogList, get_Blogs)
		.then(function (respBlogList, respBlogs) {

			try {
				_blogListDetails = respBlogList[0].d;
				$("#contentListTitle").text(_blogListDetails.Title);
				$("#contentListDesc").text(_blogListDetails.Description);
			} catch (error) {
				console.error(error);
			}
			var fullBlogData = respBlogs[0].d.results;
			for (let i = 0; i < fullBlogData.length; i++) {
				let eachBlog = fullBlogData[i];
				if (eachBlog.BlogType == "Blog") {
					_blogsCollection.push(eachBlog);
				}
				if (eachBlog.BlogType == "TV Interview") {
					_interviewCollection.push(eachBlog);
				}
				if (eachBlog.BlogType == "Editorial & Article") {
					_articleCollection.push(eachBlog);
				}
			}

			try {
				for (let i = 0; i < _blogsCollection.length; i++) {
					if (i == 3)
						break;
					else {
						getImageUrl(_blogsCollection[i], i, function (resultImgUrl, eachBlog, index) {
							$("#content" + index  + "Img").attr("src", resultImgUrl);
							$("#content" + index  + "Date").text(getFormattedDate(eachBlog.ContentDate));
							$("#content" + index  + "Title").text(SlicingTitle(eachBlog.Title));
							$("#content" + index  + "Desc").text(SlicingDesc(eachBlog.BlogContent));
							$("#content" + index  + "Anchor").attr("href", _siteUrl + "/Pages/BlogDetails.aspx?ItemID=" + eachBlog.ID);
							if (eachBlog.ContentWriterName.results.length > 0)
								$("#content" + index  + "WriterName").text("By " + eachBlog.ContentWriterName.results[0].Title);
						}, function (err) {
							console.error(err);
						});
					}
				}
			} catch (error) {
				console.error(error);
			}

			try {
				for (let i = 0; i < _interviewCollection.length; i++) {
					if (i == 3)
						break;
					else {
						getImageUrl(_interviewCollection[i], i, function (resultImgUrl, eachInterview) {
							var eachInterviewContent = getInterviewHtml(resultImgUrl, eachInterview);
							$("#tvInterviewContent").append(eachInterviewContent);
						}, function (err) {
							console.error(err);
						});
					}
				}
			} catch (error) {
				console.error(error);
			}

			try {
				for (let i = 0; i < _articleCollection.length; i++) {
					if (i == 3)
						break;
					else {
						getImageUrl(_articleCollection[i], i, function (resultImgUrl, eachArticle) {
							var eachArticleContent = getArticleHtml(resultImgUrl, eachArticle);
							$("#articleContent").append(eachArticleContent);
						}, function (err) {
							console.error(err);
						});
					}
				}
			} catch (error) {
				console.error(error);
			}

			if (_interviewCollection.length > 3)
				$("#tvInterviewLoadMore").show();
			else
				$("#tvInterviewLoadMore").hide();

			if (_articleCollection.length > 3)
				$("#articleLoadMore").show();
			else
				$("#articleLoadMore").hide();

			bindLoadMoreEvents();
		}).fail(CommonUtil.OnRESTError);
}

function getArticleHtml(resultImgUrl,eachArticle){
	var eachArticleContent = "<div class='col-lg-4'>" +
								"<a href='javascript:void(0)'>" +
									"<div class='card'>" +
										"<div class='card-img'>" +
											"<img src='" + resultImgUrl + "' alt='...'>" +
											"<span class='card-date'>" + getFormattedDate(eachArticle.ContentDate) + "</span>" +
										"</div>" +
										"<div class='card-body'>" +
											"<h5 class='card-title'>" + SlicingTitle(eachArticle.Title) + "</h5>" +
											"<p class='card-text'>" + SlicingDesc(eachArticle.BlogContent) + "</p>" +
										"</div>" +
										"<div class='card-footer'>" +
											"<p>By "+eachArticle.ContentWriterName.results[0].Title+"</p>" +
										"</div>" +
									"</div>" +
								"</a>" +
							"</div>";
	return eachArticleContent;
}

function getInterviewHtml(resultImgUrl,eachInterview){
	var eachInterviewContent="<div class='col-lg-4'>"+
														"<a href='javascript:void(0)'>"+
															"<div class='video-card'>"+
																"<div class='video-card-img'>"+
																	"<img src='"+resultImgUrl+"' alt=''>"+
																	"<button class='open-video'><i class='fas fa-caret-right'></i></button>"+
																"</div>"+
																"<div class='video-card-content'>"+
																	"<p class='video-card-date'>"+getFormattedDate(eachInterview.ContentDate)+"</p>"+
																	"<h4>"+SlicingTitle(eachInterview.Title)+"</h4>"+
																	"<p>By "+eachInterview.ContentWriterName.results[0].Title+"</p>"+
																"</div>"+
															"</div>"+
														"</a>"+
													"</div>";
	return eachInterviewContent;
}

function bindLoadMoreEvents(){
	$("#tvInterviewLoadMore").on("click",function(){
		for(let i=interviewActiveIndex;i<_interviewCollection.length;i++)
		{
			interviewActiveIndex++;
			if(i==(interviewActiveIndex+3))
				break;
			else{
				getImageUrl(_interviewCollection[i],i,function(resultImgUrl,eachInterview){
					let eachInterviewContent=getInterviewHtml(resultImgUrl,eachInterview);
					$("#tvInterviewContent").append(eachInterviewContent);
				},function(err){
					console.error(err);
				});
			}
		}
		if(interviewActiveIndex==_interviewCollection.length)
			$("#tvInterviewLoadMore").hide();
		else
			$("#tvInterviewLoadMore").show();
	});

	$("#articleLoadMore").on("click",function(){
		for(let i=articleActiveIndex;i<_articleCollection.length;i++)
		{
			articleActiveIndex++;
			if(i==(articleActiveIndex+3))
				break;
			else{
				getImageUrl(_articleCollection[i],i,function(resultImgUrl,eachArticle){
					let eachArticleContent=getArticleHtml(resultImgUrl,eachArticle);
					$("#articleContent").append(eachArticleContent);
				},function(err){
					console.error(err);
				});
			}
		}
		if(articleActiveIndex==_articleCollection.length)
			$("#articleLoadMore").hide();
		else
			$("#articleLoadMore").show();
	});
}