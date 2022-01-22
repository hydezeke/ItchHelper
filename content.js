$(function(){
    let localStorage = window.localStorage;
    function saveLocalStorage(){
        let data = {
            "ih_text_filter":searchinput.val(),
            "filter":filter
        };
        data.ih_filter = filter;
        chrome.storage.local.set(data);
        console.log("Saved local storage..."+searchinput.text());
    }
    function loadLocalStorage(){
        let txt = localStorage.getItem("ih_text_filter") ?? "";
        chrome.storage.local.get(["ih_text_filter", "filter"], function(result){
            console.log(result);
            if(result.filter != null){
                for(let f in result.filter){
                    filter[f] = result.filter[f];
                }
            }

            refreshDashboard({instant:true});
        });
        return;
        
        searchinput.text(txt);
        filter_published = localStorage.getItem("ih_filter_published");
        if(filter_published == null) filter_published = true;
        filter_restricted = localStorage.getItem("ih_filter_restricted");
        if(filter_restricted == null) filter_restricted = true;
        filter_draft = localStorage.getItem("ih_filter_draft");
        if(filter_draft == null) filter_draft = true;

        console.log("Loaded local storage..."+txt);
    }


    
    console.log("Jquery loaded on extension!");

    const filter_btns = {
        published: $(`<div class="publish_status ih_filter_btn"><span class="tag_bubble green"><a href="#">Published</a></span></div>`),
        draft: $(`<div class="publish_status ih_filter_btn"><span class="tag_bubble red"><a href="#">Draft</a></span></div>`),
        restricted: $(`<div class="publish_status ih_filter_btn"><span class="tag_bubble purple"><a href="#">Restricted</a></span></div>`),
        mine: $(`<div class="publish_status ih_filter_btn"><span class="tag_bubble ih_lightgrey"><a href="#">Mine</a></span></div>`),
        others: $(`<div class="publish_status ih_filter_btn"><span class="tag_bubble ih_darkgrey"><a href="#">Collab</a></span></div>`)
    }

    let filter_buttons = $(`<div class="ih_filters"><span style="opacity: 0.5;">Filter:</span></div>`);
    let filter = {
    };
    for(let f in filter_btns){
        filter[f] = true;
        filter_buttons.append(filter_btns[f]);
        let ff = f;
        filter_btns[f].on("click", function(){
            filter[ff] = !filter[ff];
            refreshDashboard();
        });
    }

    function refreshDashboard(options={}){
        saveLocalStorage();
        let val = searchinput.val();
        val = val.replaceAll(" ","");
        val = val.toLowerCase();
        $(".game_row").each(function(index, elem){
            let game = $(elem);
            let title = game.find(".game_link");
            let text = title.text();
            text = text.replaceAll(" ", "");
            text = text.toLowerCase();
            let show = val == "" || text.includes(val);
            let owner = $(elem).find(".owner");
            if(show){
                let txt = game.find(".publish_status").find("a").text().toLowerCase();
                if(!filter.published && txt.includes("published")) show = false;
                else if(!filter.restricted && txt.includes("restricted")) show = false;
                else if(!filter.draft && txt.includes("draft")) show = false;
                else if(!filter.mine && owner.length == 0) show =false;
                else if(!filter.others && owner.length > 0) show = false;
            }

            let time = 200;
            if(options.instant) time = 0;
            if(show){
                if(!game.is(":visible")){
                    game.show(time);
                }
                else{
                    game.show();
                }
            }
            else{
                if(game.is(":visible")){
                    game.hide(time);
                }
                else{
                    game.hide();
                }
            }
        });

        for(let f in filter_btns){
            if(filter[f]) filter_btns[f].css("opacity", 1);
            else filter_btns[f].css("opacity", 0.4);
        }
        
    }


    let search = $(`<div class="ih_dash_search"></div>`);
    let searchinput = $(`<input type="text" class="ih_dash_search_input search_input"></input>`);
    let searchsvg = $(`<svg width="30px" stroke-linecap="round" stroke="currentColor" class="svgicon icon_search" role="img" version="1.1" viewBox="0 0 24 24" stroke-width="3" height="18" stroke-linejoin="round" aria-hidden="" fill="none" width="18"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`);
    search.append(searchsvg);
    search.append(searchinput);
    
    let leftCol = $(`.left_col`);
    if(leftCol.length){
        leftCol = leftCol.first();
        leftCol.prepend(filter_buttons);
        leftCol.prepend(search);
        setTimeout(function(){
            leftCol.fadeTo(300, 1);
        }, 50)
        
        searchinput.on("input", function(){
            refreshDashboard();
        });
    }
    loadLocalStorage();
});
console.log("Extension!");
