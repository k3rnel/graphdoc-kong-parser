let fs = require('fs');
const jsdom = require("jsdom");
const {JSDOM} = jsdom;
const pagesPath = __dirname + '/pages';
const resultPath = __dirname + '/result'
const parsedPagesPath = resultPath + '/pages';
const pageLayout = '_base.html';

const pageLayoutTemplate = `{% layout = "layouts/${pageLayout}" %}\n\n`;
const contentHeadingTemplate = `{-contentHeading-}`;
const contentBodyTemplate = `{-contentBody-}`;
const requireByTemplate = `{-requireBy-}`;

// Router variables
const configPath = resultPath + '/config'
const contentPath = resultPath + '/content';

const files = fs.readdirSync(pagesPath);

let routerConfig = '';

files.forEach(function (fileName) {
    parseHtml(fileName);
    prepareRouterConfig(fileName);
    generateContentFile(fileName);
});

storeRouterConfig();

function prepareRouterConfig(file) {
    const entityName = file.replace('.doc', '').replace('.html', '');

    routerConfig += `/${entityName}: content/${entityName}.txt\n`
}

function storeRouterConfig() {
    fs.writeFileSync(`${configPath}/router.conf.yaml`, routerConfig);
}

function generateContentFile(file) {
    const entityName = file.replace('.spec', '').replace('.doc', '').replace('.html', '');

    let contentTemplate = `---
layout: pages/${entityName}.html
---`;

    fs.writeFileSync(`${contentPath}/${entityName}.txt`, contentTemplate);
}

function parseHtml(file) {
    const fileContent = fs.readFileSync(`${pagesPath}/${file}`, 'utf8',);

    let window = new JSDOM(fileContent).window;
    let document = window.document;
    let elements = document.getElementsByClassName("slds-text-heading--large");

    let $ = require('jquery')(window);
    if (elements.length > 0) {
        const contentHeading = elements[0].parentElement.innerHTML;
        let jqueryContentBody = $('#graphql-schema-definition').siblings('code');
        let jqueryRequireBy = $('.require-by');

        $.each(jqueryContentBody.find('a'), function () {
            $(this).attr('href', './'+$(this).attr('href').replace('.doc', '').replace('.spec', '').replace('.html', ''));
        });
        $.each(jqueryRequireBy.find('a'), function () {
            $(this).attr('href', './'+$(this).attr('href').replace('.doc', '').replace('.spec', '').replace('.html', ''));
        });

        const parsedPageContent = pageLayoutTemplate
            + contentHeadingTemplate
            + "\n"
            + contentHeading.trim()
            + "\n"
            + contentHeadingTemplate
            + "\n"
            + contentBodyTemplate
            + "\n"
            + $('<div>').append(jqueryContentBody.clone()).html()
            + "\n"
            + contentBodyTemplate
            + "\n"
            + requireByTemplate
            + "\n"
            + $('<div>').append(jqueryRequireBy.clone()).html()
            + "\n"
            + requireByTemplate;

        fs.writeFileSync(`${parsedPagesPath}/${file.replace('.doc', '').replace('.spec', '')}`, parsedPageContent);
    } else {
        console.log(file, 'has error');
    }
}
