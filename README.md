FCC-Proceeding-14-28-Data
=========================

This is to build a dataset of what people have to say about net neutrality on the FCC's ECFS. Read more about it [here](http://stonelinks.github.io/posts/FCC-data/). This repo is just the scraper and data maniuplation tools. The actual data is here: https://dl.dropboxusercontent.com/u/4428042/FCC-Proceeding-14-28-Data-latest.tar.gz

Right now it is about 727 MB and contains 153720 records. Since the FCC's website uses PDFs for everything I've gone ahead and converted everything into plaintext using the [pdf-extract](https://www.npmjs.org/package/pdf-extract) library. As of now there is 570 MB of plaintext comments in there.

To dowload and extract on  *nix platform 

```bash
mkdir FCC-data && cd FCC-data
wget https://dl.dropboxusercontent.com/u/4428042/FCC-Proceeding-14-28-Data-latest.tar.gz
tar zxf FCC-Proceeding-14-28-Data-latest.tar.gz
```

Inside you'll find pdf and text archive of all the comments, as well as a JSON database called `filings.json`
