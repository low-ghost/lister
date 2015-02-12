lister
======

a listing module with pagination and filtering built in. Requires jQuery and low_ghost.js.

INSTRUCTIONS

In js file, add an options variable with an object formatted similarly to settings default object bellow. If the default is acceptable, simply don't include it. Example:
   
    var options = { itemsPerPage : 4,
        searchInput : "#search",
        paginationElement : "#page-box",
        autoSort : "asc",
        autoSortKey : ".title"
    };

    var listKeys = [".title", ".author", ".description"], // list keys and sortKeys match 1:1, so if
        sortKeys = ["none", "#sort-author-button"];          a key should not be sortable, include
                                                            a string signifing this (not empty!) or
                                                            ignore end values
    var list = new Lister(options, listKeys, sortKeys);

DEFAULTS

    var settings = {
        listID : "#list",
        liEquiv : "li",  //top level of the individual list objects, can be anything
        searchInput : "#search",
        autoSort : "", //Leave blank if not choosen, otherwise "asc" or "desc"
        autoSortKey : "", //Leave blank or choose same selector string as listKeys1 or listKeys2
                          //ex. ".key1"
        //pagination
        itemsPerPage : 0, //leave at zero to opt out of pagination (bit faster)
        paginationElement : "#pagination", //replace to choose existing element or name of element
                                           //to be appended. Use only ID as selector ex. "#page-numbers"
        paginationLeft : 3,
        paginationInner : 3, //gives more numbers after active page if an even number
        paginationRight : 3,
        stringBeforeNum : "" //include whitespace if needed
    };

    if (!listKeys){
        var listKeys = [".key1", ".key2"];
    }
    if (!sortKeys){
        var sortKeys = ["#sKey1", "#sKey2"];
    }
