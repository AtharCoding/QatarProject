var CommonUtil = CommonUtil || {};

CommonUtil.ID = "ID";
CommonUtil.Id = "Id";
CommonUtil.Title = "Title";
CommonUtil.EMail = "EMail";

CommonUtil.Key = "Key";
CommonUtil.Value = "Value";

CommonUtil.PeoplePickerSchema = {
    'PrincipalAccountType': 'User,DL,SecGroup,SPGroup',
    'SearchPrincipalSource': 15,
    'ResolvePrincipalSource': 15,
    'AllowMultipleValues': true,
    'MaximumEntitySuggestions': 50,
    'Width': '280px',
}

CommonUtil.InitializePeoplePicker = function (peoplePickerElementId) {
    SPClientPeoplePicker_InitStandaloneControlWrapper(peoplePickerElementId, null, CommonUtil.PeoplePickerSchema);

    $(".sp-peoplepicker-topLevel").css({ "height": "auto", "width": "90%" });
    $(".sp-peoplepicker-topLevel").addClass('form-control');
    $(".sp-peoplepicker-autoFillContainer").css({ "max-width": "100%", "min-width": "100%" });
}

CommonUtil.InitializePeoplePickerWithOptions = function(peoplePickerElementId, AllowMultipleValues, PeopleorGroup, GroupID) {
    var schema = {};
    schema['SearchPrincipalSource'] = 15;
    schema['ResolvePrincipalSource'] = 15;
    schema['MaximumEntitySuggestions'] = 50;
    schema['Width'] = '280px';
    schema['AllowMultipleValues'] = AllowMultipleValues;
    schema['PrincipalAccountType'] = (PeopleorGroup == 'PeopleOnly') ? 'User' : 'User,DL,SecGroup,SPGroup';

    if (GroupID > 0) {
        schema['SharePointGroupID'] = GroupID
    }

    SPClientPeoplePicker_InitStandaloneControlWrapper(peoplePickerElementId, null, schema);
    // $(".sp-peoplepicker-topLevel").css({ "height": "auto", "width": "100%" });
    $(".sp-peoplepicker-topLevel").addClass('form-control');
    $(".sp-peoplepicker-autoFillContainer").css({ "max-width": "100%", "min-width": "100%" });
}

CommonUtil.SetPeoplePickerValue = function (elementId, userEmail) {
    SPClientPeoplePicker.SPClientPeoplePickerDict[elementId + "_TopSpan"].AddUserKeys(userEmail);
}

CommonUtil.DoClearPeoplPicker = function(peoplepickerId)
{
    SPClientPeoplePicker.SPClientPeoplePickerDict[peoplepickerId + "_TopSpan"].DeleteProcessedUser();
}

CommonUtil.DoDisablePplPicker = function(pplId, flag){

	$("#" + pplId + "_TopSpan_EditorInput").prop('disabled', flag);
	$($("#" + pplId + "_TopSpan_ResolvedList").find("a.sp-peoplepicker-delImage")).toggle(!flag);
}

CommonUtil.GetPeoplePickerUser = function (peoplepickerId) {
    var deferred = $.Deferred();
    var peoplePicker = SPClientPeoplePicker.SPClientPeoplePickerDict[peoplepickerId + "_TopSpan"];
    // Get information about all users.
    var users = peoplePicker.GetAllUserInfo();

    // $pnp.sp.web.siteUsers.getByLoginName(users[0].Key).get()
    $pnp.sp.web.ensureUser(users[0].Key)
        .then(function (user) {
            deferred.resolve(user.data);
        })
        .catch(function (err) {
            deferred.reject(err);
        });

    return deferred.promise();
}

CommonUtil.GetMultiplePeoplePickerUser = function (peoplepickerId) {
    var deferred = $.Deferred();
    var peoplePicker = SPClientPeoplePicker.SPClientPeoplePickerDict[peoplepickerId + "_TopSpan"];
    // Get information about all users.
    var users = peoplePicker.GetAllUserInfo();
    var total_users = users.length; // if it doesn't work, make it a global variable
    var resolved_users_arr = []; // if it doesn't work, make it a global variable

    for (var i = 0; i < total_users; i++) {
        $pnp.sp.web.ensureUser(users[i].Key)
            .then(function (user) {
                resolved_users_arr.push(user.data);

                if (resolved_users_arr.length == total_users) {
                    deferred.resolve(resolved_users_arr);
                }
            })
            .catch(function (err) {
                deferred.reject(err);
            });
    }

    return deferred.promise();
}

CommonUtil.GetUserIDByEmail = function(userName) {
    
    var call = $.ajax({
        url: _spPageContextInfo.siteAbsoluteUrl + "/_api/web/siteusers(@v)?@v='" +
                   encodeURIComponent(userName) + "'",
        method: "GET",
        async: false,
        headers: { "Accept": "application/json; odata=verbose" },
    });

    return call;
}

CommonUtil.DoValidatePeoplePicker = function (peoplepickerId, maxCount, isMandatory, type) {
    var peoplePicker = SPClientPeoplePicker.SPClientPeoplePickerDict[peoplepickerId + "_TopSpan"];

    if (peoplePicker.IsEmpty() && isMandatory) return "Please enter value.";
    else if (peoplePicker.HasInputError || (isMandatory && !peoplePicker.HasResolvedUsers())) return "Couldn't resolve.";
    else if (peoplePicker.TotalUserCount > maxCount) return "Only " + maxCount + " values are allowed";

    return "";
}

CommonUtil.IsEmptyPeoplePicker = function (peoplepickerId) {
    var peoplePicker = SPClientPeoplePicker.SPClientPeoplePickerDict[peoplepickerId + "_TopSpan"];

    return peoplePicker.IsEmpty();
}

CommonUtil.LoadUserPropertiesByEmail = function (userEmail) {
    $pnp.sp.web.siteUsers.getByEmail(userEmail).get()
        .then(function (result) {
            var userInfo = "";
            var all_keys = Object.keys(result);
            for (var i = 0; i < all_keys.length; i++) {
                userInfo += all_keys[i] + " : " + result[all_keys[i]] + "<br>";
            }
            $("#sample").html(userInfo);
        })
        .catch(CommonUtil.OnPnPError);
}

CommonUtil.LoadUserProfilePropertiesByLoginName = function (loginName) {
    var deferred = $.Deferred();

    $pnp.sp.profiles.getPropertiesFor(loginName)
        .then(function (result) {
            var props = result.UserProfileProperties;
            var propValue = "";
            props.forEach(function (prop) {
                propValue += prop.Key + " - " + prop.Value + "<br/>";
            });
            deferred.resolve(user);
        })
        .catch(function (err) {
            deferred.reject(err);
        });

    return deferred.promise();
}

CommonUtil.GetValueByKey = function (configColl, key) {
    var items = $.grep(configColl, function (v) {
        return v.Key === key;
    });
    return (items.length > 0 ? items[0].Value : "");
}

CommonUtil.GetItemsByColValue = function (itemColl, ColName, colVal) {
    var items = $.grep(itemColl, function (item) {
        return item[ColName] === colVal;
    });
    return items;
}

CommonUtil.GetIdByKey = function (coll, key) {
    var items = $.grep(coll, function (v) {
        return v.Key === key;
    });
    return (items.length > 0 ? items[0][CommonUtil.ID] : 0);
}

CommonUtil.GetIdByColVal = function (coll, colName, colVal) {
    var items = $.grep(coll, function (coll_Item) {
        return coll_Item[colName] === colVal;
    });
    return (items.length > 0 ? items[0][CommonUtil.ID] : 0);
}

CommonUtil.GetItemByKey = function (coll, key) {
    var items = $.grep(coll, function (v) {
        return v.Key === key;
    });
    return (items.length > 0 ? items[0] : null);
}

CommonUtil.GetLookupByKey = function(coll, key)
{
    var item_id = CommonUtil.GetIdByKey(coll, key)
    var lookup_obj = new SP.FieldLookupValue();
    lookup_obj.set_lookupId(item_id);

    return lookup_obj;
}

CommonUtil.GetItemById = function (coll, itemId) {
    var items = $.grep(coll, function (v) {
        return v.ID === itemId;
    });
    return (items.length > 0 ? items[0] : null);
}

CommonUtil.GetItemsByColVal = function (coll, colName, colVal) {
    var items = $.grep(coll, function (item) {
        return item[colName] === colVal;
    });
    return items;
}

CommonUtil.GetItemsByColValIgnoreCase = function (coll, colName, colVal) {
    var items = $.grep(coll, function (item) {
        return item[colName].toLowerCase() === colVal.toLowerCase();
    });
    return items;
}

CommonUtil.GetItemsByLookupColId = function (coll, colName, lookupColId) {
    var items = $.grep(coll, function (item) {
        return item[colName][CommonUtil.ID] === lookupColId;
    });
    return items;
}

CommonUtil.GetItemsByLookupColValIgnoreCase = function (coll, colName, lookupColVal) {
    var items = $.grep(coll, function (item) {
        return item[colName][CommonUtil.Title].toLowerCase() === lookupColVal.toLowerCase();
    });
    return items;
}

CommonUtil.GetItemsByDateColVal = function (coll, colName, dateVal) {
    var items = $.grep(coll, function (item) {
        var dt_holiday = moment(item[colName]);
        return dt_holiday.isSame(dateVal, 'day');
        // item[colName].split("T")[0] === dateVal.toISOString().split("T")[0];
    });
    return items;
}

CommonUtil.GetUniqItems = function (coll, colName, valColName) {
    var obj = {};
    var unique_coll = [];
    coll.forEach(function (coll_item) {
        var item_name = coll_item[colName][valColName];
        if (!(item_name in obj)) {
            obj[item_name] = 1;
            unique_coll.push(coll_item);
        }
    });

    return unique_coll;
}

CommonUtil.BindDDL = function (ddl, itemColl, firstText, idCol, valCol) {

    $("#" + ddl).empty();

    if (firstText != undefined && firstText != "" && firstText.length != 0) {
        $("#" + ddl).append($("<option disabled selected></option>").val('0').html(firstText));
    }

    if (idCol === undefined || idCol === "") {
        idCol = CommonUtil.ID;
    }

    if (valCol === undefined || valCol === "") {
        valCol = CommonUtil.Title;
    }

    for (let i = 0; i < itemColl.length; i++) {
        $("#" + ddl).append($("<option></option>").val(itemColl[i][idCol]).html(itemColl[i][valCol]));
    }
}

CommonUtil.BindDDLByStringArray = function (ddl, itemColl, firstText) {

    $("#" + ddl).empty();

    if (firstText != undefined && firstText != "" && firstText.length != 0) {
        $("#" + ddl).append($("<option disabled selected></option>").val('0').html(firstText));
    }

    for (let i = 0; i < itemColl.length; i++) {
        $("#" + ddl).append($("<option></option>").val(itemColl[i]).html(itemColl[i]));
    }
}

CommonUtil.BindDDLByClassNameStringArray = function (ddlClassName, itemColl, firstText) {

    $("." + ddlClassName).empty();

    if (firstText != undefined && firstText != "" && firstText.length != 0) {
        $("." + ddlClassName).append($("<option disabled selected></option>").val('0').html(firstText));
    }

    for (let i = 0; i < itemColl.length; i++) {
        $("." + ddlClassName).append($("<option></option>").val(itemColl[i]).html(itemColl[i]));
    }
}

CommonUtil.BindPplDDL = function (ddl, itemColl, firstText, colName) {

    $("#" + ddl).empty();

    if (firstText != undefined && firstText != "" && firstText.length != 0) {
        $("#" + ddl).append($("<option disabled selected></option>").val('0').html(firstText));
    }

    for (let i = 0; i < itemColl.length; i++) {
        $("#" + ddl).append($("<option></option>").val(itemColl[i][colName][CommonUtil.ID]).html(itemColl[i][colName][CommonUtil.Title]));
    }
}

CommonUtil.BindLookupDDL = function (ddl, itemColl, firstText, colName) {

    $("#" + ddl).empty();

    if (firstText != undefined && firstText != "" && firstText.length != 0) {
        $("#" + ddl).append($("<option disabled selected></option>").val('0').html(firstText));
    }

    for (let i = 0; i < itemColl.length; i++) {
        $("#" + ddl).append($("<option></option>").val(itemColl[i][colName][CommonUtil.ID]).html(itemColl[i][colName][CommonUtil.Title]));
    }
}

CommonUtil.BindLookupDDLByColVal = function (ddl, itemColl, firstText, colName, valColName) {

    $("#" + ddl).empty();

    if (firstText != undefined && firstText != "" && firstText.length != 0) {
        $("#" + ddl).append($("<option disabled selected></option>").val('0').html(firstText));
    }

    for (let i = 0; i < itemColl.length; i++) {
        $("#" + ddl).append($("<option></option>").val(itemColl[i][colName][CommonUtil.ID]).html(itemColl[i][colName][valColName]));
    }
}

CommonUtil.BindPplDDLByFullName = function (ddl, itemColl, firstText, colName) {

    $("#" + ddl).empty();

    if (firstText != undefined && firstText != "" && firstText.length != 0) {
        $("#" + ddl).append($("<option disabled selected></option>").val('0').html(firstText));
    }

    for (let i = 0; i < itemColl.length; i++) {
        var full_name = itemColl[i][colName][CommonUtil.FirstName] + " " + itemColl[i][colName][CommonUtil.LastName];
        $("#" + ddl).append($("<option></option>").val(itemColl[i][colName][CommonUtil.ID]).html(full_name));
    }
}

CommonUtil.IsNullOrEmpty = function (obj) {
    return (obj === undefined || obj === null || obj === "");
}

CommonUtil.ArrayRemove = function (arr, value) {
    var result_arr = $.grep(arr, function (arrItem) {
        return arrItem !== value;
    });

    return result_arr;
}

CommonUtil.Messages = {
    GeneralErrMsg: "Something went wrong. Please contact your administrator."
}

CommonUtil.OnJSOMError = function(sender, args) 
{
    $('#loading').hide();
    alert(CommonUtil.Messages.GeneralErrMsg);
    console.log('Request failed. ' + args.get_message() +  '\n' + args.get_stackTrace());
}

CommonUtil.OnRESTError = function (Err) {
   // $("#loading").hide();
    console.log(Err);
    alert(CommonUtil.Messages.GeneralErrMsg);
}

CommonUtil.OnPnPError = function (err) {

    if (err.status === 404) {
        alert(CommonUtil.Messages.ItemNotFound);
    }
    else {
        alert(CommonUtil.Messages.GeneralErrMsg);
    }

    $("#loading").hide();
    console.log(err);
    var pnp_error = err.data.responseBody["odata.error"];
    console.log("Error message: " + pnp_error.message.value);
    console.log("Error code: " + pnp_error.code);
}

CommonUtil.IsValidFloatInTextBox = function(txtId)
{
    var amount = CommonUtil.DoGetNumber(txtId);

    var is_valid = CommonUtil.Float2DecimalRegex.test(amount) && !isNaN(amount);

    return is_valid;
}

CommonUtil.IsValidFloat = function(amount)
{
    return CommonUtil.Float2DecimalRegex.test(amount) && !isNaN(amount);
}

CommonUtil.DoGetNumber = function(txtId){
    return ($("#" + txtId).val().replace(/,/g, '') * 1);
}

CommonUtil.IsMemberOfGroup = function(groupName)
{
    var deferred = $.Deferred();

    $pnp.sp.web.siteGroups.getByName(groupName).users.get()
    .then(function(allUsers){
        var is_member = false;
        for(var i = 0; i < allUsers.length; i++)
        {
            if(allUsers[i]["Id"] === _spPageContextInfo.userId)
            {
                is_member = true;
                break;
            }
        }
        deferred.resolve(is_member);
    })
    .catch(function(err){deferred.reject(err); CommonUtil.OnPnPError(err);});

    return deferred.promise();
}

CommonUtil.getFinancialYearOfDate = function (reqDate) {
    var financial_year = "";
    if ((reqDate.getMonth() + 1) <= 3) {
        financial_year = (reqDate.getFullYear() - 1) + "-" + reqDate.getFullYear()
    } else {
        financial_year = reqDate.getFullYear() + "-" + (reqDate.getFullYear() + 1)
    }
    return financial_year;
}

CommonUtil.GetUrlVars = function() {
	var vars = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
		vars[key] = value;
	});
	return vars;
}

CommonUtil.GetObjectValues = function(coll){
    var values = Object.keys(coll).map(function(e) {
        return coll[e]
      })

    return values;
}

function GetPeoplePickerUser(peoplepickerId) {
    var deferred = $.Deferred();
    var peoplePicker = SPClientPeoplePicker.SPClientPeoplePickerDict[peoplepickerId + "_TopSpan"];
    // Get information about all users.
    var users = peoplePicker.GetAllUserInfo();

    $pnp.sp.web.ensureUser(users[0].Key)
        .then(function (ensuredUser) {
            $pnp.sp.web.siteUsers.getByLoginName(ensuredUser.data.LoginName).get()
                .then(function (user) {
                    deferred.resolve(user);
                })
                .catch(function (err) {
                    deferred.reject(err);
                });
        })
        .catch(function (err) {
            deferred.reject(err);
        });

    return deferred.promise();
}