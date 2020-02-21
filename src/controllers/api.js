var util = require('../js/util.js');
const GalleryModel = require('../models/gallery');
const PagesModel = require('../models/pages');
const ContactModel = require('../models/contacts');
const CommentsModel = require('../models/comments');
const BlogsModel = require('../models/blog');
class ApiController {
    addOrEditGallery(req, res){
        const reqBody = util.getPassFields(['title'], req.body);
        if(!req.body.galleryId && !reqBody.title) {
            res.json(util.getResponses('003', {}));
            return;
        }
        reqBody.coverImage = '';
        reqBody.images = [];
        if(req.files && req.files['coverImage'] && req.files['coverImage'].length) {
            reqBody.coverImage = req.files['coverImage'][0].filename;
        }
        if(req.files && req.files['images'] && req.files['images'].length) {
            req.files['images'].forEach(file => {
                reqBody.images.push(file.filename);
            });
        }
        const galleryId = req.body.galleryId ? req.body.galleryId : util.getMongoObjectId();
        const galleryDoc = new GalleryModel({_id: galleryId});
        galleryDoc.getById((err, gallery) => {
            if(gallery != null && gallery._id) {
                gallery.title = reqBody.title ? reqBody.title : gallery.title;
                gallery.coverImage = reqBody.coverImage ? reqBody.coverImage : gallery.coverImage;
                gallery.images = gallery.images.concat(reqBody.images);
                gallery.save();
                res.json(util.getResponses('020', {galleryId}));
            } else {
                if(reqBody.images.length == 0) {
                    res.json(util.getResponses('042', {}));
                    return;
                }
                const currentTime = util.current_time();
                const newGallery = new GalleryModel({
                    _id: galleryId,
                    ...reqBody,
                    createdAt: {
                        date: new Date(currentTime),
                        dateTime: currentTime,
                        timeStamp: new Date(currentTime).getTime()
                    }
                });
                const err = newGallery.validateSync();
                if(err) {
                    res.json(util.getResponses('045', {err}));
                    return;
                }
                newGallery.save().then(doc => {
                    res.json(util.getResponses('020', {galleryId}));
                }).catch(e => {
                    res.json(util.getResponses('003', {err: e}));
                });
            }
        });
    }

    getGallery(req, res) {
        const reqBody = util.getPassFields(['offset', 'limit', 'accending', 'sortBy', 'searchText'], req.body);
        var sort = { };
        if(reqBody.sortBy && reqBody.sortBy == 'title') {
            sort[reqBody.sortBy] = reqBody.accending && reqBody.accending == 'true' ? 1 : -1;
        } else {
            sort["createdAt.dateTime"] = reqBody.accending && reqBody.accending == 'true' ? 1 : -1;
        }
        reqBody.lookups = [{ $sort : sort }];
        reqBody.condition = [];
        if(req.params.hasOwnProperty('_id')) {
            reqBody.condition.push({_id: req.params._id});
        }
        if(typeof reqBody.searchText == 'string' && reqBody.searchText.length > 3) {
            const $pattern = new RegExp(reqBody.searchText, 'i');
            reqBody.condition.push({
                $or: [
                    {title: {$regex: $pattern}},
                    {_id: reqBody.searchText},
                    {"createdAt.dateTime": {$regex: $pattern}}
                ]
            })
        }
        const galleryDoc = new GalleryModel({});
        galleryDoc.getData(reqBody, (err, data) => {
            if(err) {
                res.json(util.getResponses('003', {err}));
                return;
            }
            res.json(util.getResponses('020', data));
        });
    }

    checkPageSlug(req, res, next) {
        if(typeof req.body.slug == 'string') {
            const reqBody = util.getPassFields(['pageId', 'slug'], req.body);
            const doc = {slug: reqBody.slug};
            if(reqBody.pageId){
                doc._id = reqBody.pageId;
            }
            const pageDoc = new PagesModel(doc);
            pageDoc.findBySlug(page => {
                if(page) {
                    res.json(util.getResponses('046', {}));
                } else {
                    next();
                }
            });
        } else {
            next();
        }
    }

    addOrEditPage(req, res){
        const reqBody = util.getPassFields(['title', 'slug', 'content'], req.body);
        if(!req.body.pageId && (!reqBody.title || !reqBody.slug)) {
            res.json(util.getResponses('003', {}));
            return;
        }
        reqBody.coverImage = '';
        if(req.file && req.file.filename) {
            reqBody.coverImage = req.file.filename;
        }
        const pageId = req.body.pageId ? req.body.pageId : util.getMongoObjectId();
        const pageDoc = new PagesModel({_id: pageId});
        pageDoc.getById((err, page) => {
            if(page != null && page._id) {
                Object.keys(reqBody).forEach(key => {
                    if(key != "coverImage") {
                        page[key] = reqBody[key];
                    }
                });
                page.coverImage = reqBody.coverImage ? reqBody.coverImage : page.coverImage;
                page.save();
                res.json(util.getResponses('020', {pageId}));
            } else {
                const currentTime = util.current_time();
                const newpage = new PagesModel({
                    _id: pageId,
                    ...reqBody,
                    createdAt: {
                        date: new Date(currentTime),
                        dateTime: currentTime,
                        timeStamp: new Date(currentTime).getTime()
                    }
                });
                const err = newpage.validateSync();
                if(err) {
                    res.json(util.getResponses('045', {err}));
                    return;
                }
                newpage.save().then(doc => {
                    res.json(util.getResponses('020', {pageId}));
                }).catch(e => {
                    res.json(util.getResponses('003', {err: e}));
                });
            }
        });
    }

    getPages(req, res) {
        const reqBody = util.getPassFields(['offset', 'limit', 'accending', 'sortBy', 'searchText'], req.body);
        var sort = { };
        if(reqBody.sortBy && ['title', 'slug'].indexOf(reqBody.sortBy) > -1) {
            sort[reqBody.sortBy] = reqBody.accending && reqBody.accending == 'true' ? 1 : -1;
        } else {
            sort["createdAt.dateTime"] = reqBody.accending && reqBody.accending == 'true' ? 1 : -1;
        }
        reqBody.lookups = [{ $sort : sort }];
        reqBody.condition = [];
        if(req.params.hasOwnProperty('_id')) {
            reqBody.condition.push({_id: req.params._id});
        }
        if(typeof reqBody.searchText == 'string' && reqBody.searchText.length > 3) {
            const $pattern = new RegExp(reqBody.searchText, 'i');
            reqBody.condition.push({
                $or: [
                    {title: {$regex: $pattern}},
                    {slug: {$regex: $pattern}},
                    {_id: reqBody.searchText},
                    {"createdAt.dateTime": {$regex: $pattern}}
                ]
            })
        }
        const pageDoc = new PagesModel({});
        pageDoc.getData(reqBody, (err, data) => {
            if(err) {
                res.json(util.getResponses('003', {err}));
                return;
            }
            res.json(util.getResponses('020', data));
        });
    }

    newContact(req, res){
        const reqBody = util.getPassFields(['name', 'emailId', 'message'], req.body);
        if(!reqBody.name || !reqBody.emailId || !reqBody.message) {
            res.json(util.getResponses('003', {}));
            return;
        }
        const contactId = util.getMongoObjectId();
        const currentTime = util.current_time();
        const contactDoc = new ContactModel({
            _id: contactId,
            ...reqBody,
            createdAt: {
                date: new Date(currentTime),
                dateTime: currentTime,
                timeStamp: new Date(currentTime).getTime()
            }
        });
        const err = contactDoc.validateSync();
        if(err) {
            res.json(util.getResponses('045', {err}));
            return;
        }
        contactDoc.save().then(doc => {
            res.json(util.getResponses('020', {contactId}));
        }).catch(e => {
            res.json(util.getResponses('003', {err: e}));
        });
    }

    getContacts(req, res) {
        const reqBody = util.getPassFields(['offset', 'limit', 'accending', 'sortBy', 'searchText'], req.body);
        var sort = { };
        if(reqBody.sortBy && ['name', 'emailId'].indexOf(reqBody.sortBy) > -1) {
            sort[reqBody.sortBy] = reqBody.accending && reqBody.accending == 'true' ? 1 : -1;
        } else {
            sort["createdAt.dateTime"] = reqBody.accending && reqBody.accending == 'true' ? 1 : -1;
        }
        reqBody.lookups = [{ $sort : sort }];
        reqBody.condition = [];
        if(req.params.hasOwnProperty('_id')) {
            reqBody.condition.push({_id: req.params._id});
        }
        if(typeof reqBody.searchText == 'string' && reqBody.searchText.length > 3) {
            const $pattern = new RegExp(reqBody.searchText, 'i');
            reqBody.condition.push({
                $or: [
                    {name: {$regex: $pattern}},
                    {emailId: {$regex: $pattern}},
                    {message: {$regex: $pattern}},
                    {_id: reqBody.searchText},
                    {"createdAt.dateTime": {$regex: $pattern}}
                ]
            });
        }
        const contactDoc = new ContactModel({});
        contactDoc.getData(reqBody, (err, data) => {
            if(err) {
                res.json(util.getResponses('003', {err}));
                return;
            }
            res.json(util.getResponses('020', data));
        });
    }

    newComment(req, res){
        const reqBody = util.getPassFields(['name', 'emailId', 'message', 'blogId'], req.body);
        if(!reqBody.name || !reqBody.emailId || !reqBody.message || !reqBody.blogId) {
            res.json(util.getResponses('003', {}));
            return;
        }
        const commentId = util.getMongoObjectId();
        const currentTime = util.current_time();
        const commentDoc = new CommentsModel({
            _id: commentId,
            ...reqBody,
            createdAt: {
                date: new Date(currentTime),
                dateTime: currentTime,
                timeStamp: new Date(currentTime).getTime()
            }
        });
        const err = commentDoc.validateSync();
        if(err) {
            res.json(util.getResponses('045', {err}));
            return;
        }
        commentDoc.save().then(doc => {
            res.json(util.getResponses('020', {commentId}));
        }).catch(e => {
            res.json(util.getResponses('003', {err: e}));
        });
    }

    getComments(req, res) {
        const reqBody = util.getPassFields(['offset', 'limit', 'accending', 'sortBy', 'searchText'], req.body);
        var sort = { };
        if(reqBody.sortBy && ['name', 'emailId'].indexOf(reqBody.sortBy) > -1) {
            sort[reqBody.sortBy] = reqBody.accending && reqBody.accending == 'true' ? 1 : -1;
        } else {
            sort["createdAt.dateTime"] = reqBody.accending && reqBody.accending == 'true' ? 1 : -1;
        }
        reqBody.lookups = [
            { $sort : sort },
            {
                $lookup: {
                    from: 'blogs',
                    localField: 'blogId',
                    foreignField: '_id',
                    as: 'blog'
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [		            	
                            "$$ROOT",
                            {blog: { $arrayElemAt: ["$blog", 0] }}
                        ]
                    }
                }
            }
        ];
        reqBody.condition = [];
        if(req.params.hasOwnProperty('_id')) {
            reqBody.condition.push({_id: req.params._id});
        }
        if(typeof reqBody.searchText == 'string' && reqBody.searchText.length > 3) {
            const $pattern = new RegExp(reqBody.searchText, 'i');
            reqBody.condition.push({
                $or: [
                    {name: {$regex: $pattern}},
                    {emailId: {$regex: $pattern}},
                    {message: {$regex: $pattern}},
                    {"blog.title": {$regex: $pattern}},
                    {"blog.slug": {$regex: $pattern}},
                    {blogId: reqBody.searchText},
                    {_id: reqBody.searchText},
                    {"createdAt.dateTime": {$regex: $pattern}}
                ]
            });
        }
        const commentDoc = new CommentsModel({});
        commentDoc.getData(reqBody, (err, data) => {
            if(err) {
                res.json(util.getResponses('003', {err}));
                return;
            }
            res.json(util.getResponses('020', data));
        });
    }

    checkBlogSlug(req, res, next) {
        if(typeof req.body.slug == 'string') {
            const reqBody = util.getPassFields(['blogId', 'slug'], req.body);
            const doc = {slug: reqBody.slug};
            if(reqBody.blogId){
                doc._id = reqBody.blogId;
            }
            const blogDoc = new BlogsModel(doc);
            blogDoc.findBySlug(blog => {
                if(blog) {
                    res.json(util.getResponses('046', {}));
                } else {
                    next();
                }
            });
        } else {
            next();
        }
    }
    
    addOrEditBlog(req, res){
        const reqBody = util.getPassFields(['title', 'slug', 'content', 'description'], req.body);
        const comments = typeof req.body.comments == 'string' ? req.body.comments == 'true' : false;
        if(!req.body.blogId && (!reqBody.title || !reqBody.slug || !reqBody.description)) {
            res.json(util.getResponses('003', {}));
            return;
        }
        reqBody.coverImage = '';
        if(req.file && req.file.filename) {
            reqBody.coverImage = req.file.filename;
        }
        const blogId = req.body.blogId ? req.body.blogId : util.getMongoObjectId();
        const blogDoc = new BlogsModel({_id: blogId});
        blogDoc.getById((err, blog) => {
            if(blog != null && blog._id) {
                Object.keys(reqBody).forEach(key => {
                    if(key != "coverImage") {
                        blog[key] = reqBody[key];
                    }
                });
                blog.comments = req.body.comments ? comments : blog.comments;
                blog.coverImage = reqBody.coverImage ? reqBody.coverImage : blog.coverImage;
                blog.save();
                res.json(util.getResponses('020', {blogId}));
            } else {
                const currentTime = util.current_time();
                const newblog = new BlogsModel({
                    _id: blogId,
                    comments,
                    ...reqBody,
                    createdAt: {
                        date: new Date(currentTime),
                        dateTime: currentTime,
                        timeStamp: new Date(currentTime).getTime()
                    }
                });
                const err = newblog.validateSync();
                if(err) {
                    res.json(util.getResponses('045', {err}));
                    return;
                }
                newblog.save().then(doc => {
                    res.json(util.getResponses('020', {blogId}));
                }).catch(e => {
                    res.json(util.getResponses('003', {err: e}));
                });
            }
        });
    }

    getBlogs(req, res) {
        const reqBody = util.getPassFields(['offset', 'limit', 'accending', 'sortBy', 'searchText'], req.body);
        var sort = { };
        if(reqBody.sortBy && ['title', 'slug'].indexOf(reqBody.sortBy) > -1) {
            sort[reqBody.sortBy] = reqBody.accending && reqBody.accending == 'true' ? 1 : -1;
        } else {
            sort["createdAt.dateTime"] = reqBody.accending && reqBody.accending == 'true' ? 1 : -1;
        }
        reqBody.lookups = [{ $sort : sort }];
        reqBody.condition = [];
        if(req.params.hasOwnProperty('_id')) {
            reqBody.condition.push({_id: req.params._id});
        }
        if(typeof reqBody.searchText == 'string' && reqBody.searchText.length > 3) {
            const $pattern = new RegExp(reqBody.searchText, 'i');
            reqBody.condition.push({
                $or: [
                    {title: {$regex: $pattern}},
                    {slug: {$regex: $pattern}},
                    {description: {$regex: $pattern}},
                    {_id: reqBody.searchText},
                    {"createdAt.dateTime": {$regex: $pattern}}
                ]
            })
        }
        const blogDoc = new BlogsModel({});
        blogDoc.getData(reqBody, (err, data) => {
            if(err) {
                res.json(util.getResponses('003', {err}));
                return;
            }
            res.json(util.getResponses('020', data));
        });
    }

    models = {
        blogs: BlogsModel,
        gallery: GalleryModel,
        pages: PagesModel,
        comments: CommentsModel,
        contacts: ContactModel
    };

    delete(collectionName){
        return (req, res) => {
            if(!req.body.docId) {
                res.json(util.getResponses('003', {}));
                return;
            }
            this.models[collectionName].findOneAndDelete({_id: req.body.docId}, (err, result) => {
                if(err) {
                    res.json(util.getResponses('003', {err}));
                    return;
                }
                res.json(util.getResponses('020', result));
            });
        }
    }
}

module.exports = ApiController;