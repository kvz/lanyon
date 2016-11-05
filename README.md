# lanyon
dr. Jekyll has turned into mr. Hyde. Lanyon to the rescue!

> He wrote to Lanyon (in Dr. Jekyll's hand), asking his friend to retrieve the contents of a cabinet in his laboratory and to meet him at midnight at Hastie Lanyon's home in Cavendish Square. In Lanyon's presence, Mr. Hyde mixed the potion and transformed back to Dr. Jekyll. The shock of the sight instigated Lanyon's deterioration and death.

Jekyll in my opinion is the #1 static site generator, for content. Things that are straightforward in Jekyll require odd layout hacks in Hexo, or are just not possible in Hugo. Metalsmith's 'everything is a plugin' is nice, but it means you have to figure out how to piece things together and there's little in the way of convention, and re-usability. The Jekyll ecosystem is massive, and GitHub (pages) support is a nice extra.

But there's a problem. Ruby, and its assets builders. We used to have a decent jekyll-assets plugin, but it was replaced with a completely new project as of Jekyll 3, basically throwing away 500% of its features. The SASS gem is behind on C's and Node's. It's slow. File watching in Ruby is broken more often than working, and nobody seems to be interested in fixing it. They seem to be going nowhere.

When these problems are resolved, Lanyon hopes to deteriorate and die, just as in Robert Louis Stevenson's novella. Until that time, we aim to fix asset building and filewatching by leveraging the Node.js ecosystem for that. In addition we aim to solve the "my Ruby is broken" problem by installing Jekyll you and providing a wrapper around it.
