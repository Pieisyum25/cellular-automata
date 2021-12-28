
window.addEventListener("load", insertHeader, true);

function insertHeader(){
    const header = document.createElement("header");

    const icon = document.createElement("img");
    icon.classList.add("header_icon");
    icon.src = "img/cat_tile.png";
    header.appendChild(icon);

    const text = document.createElement("div");
    text.classList.add("header_text_container");
    
    const name = document.createElement("h1");
    name.classList.add("header_name");
    name.innerText = "Pieisyum25";
    text.appendChild(name);

    const navBar = document.createElement("nav");
    const navList = document.createElement("ul");
    navList.classList.add("nav_list");
    const homeItem = document.createElement("li");
    homeItem.classList.add("nav_item");
    const homeLink = document.createElement("a");
    homeLink.classList.add("nav_link");
    homeLink.innerText = "Home";
    homeLink.href = "https://pieisyum25.github.io";
    homeItem.appendChild(homeLink);
    navList.appendChild(homeItem);
    const fakeItem = document.createElement("li");
    fakeItem.classList.add("nav_item");
    const fakeLink = document.createElement("a");
    fakeLink.classList.add("nav_link");
    fakeLink.innerText = "Fake";
    fakeLink.href = "https://pieisyum25.github.io";
    fakeItem.appendChild(fakeLink);
    navList.appendChild(fakeItem);
    navBar.appendChild(navList);
    text.appendChild(navBar);

    header.appendChild(text);


    document.body.prepend(header);
}