# Frontend Server Repo - Large Scale - team 4  

### blob-storage - Temporary storage server
```sh
node app.js
```

### server - Frontend server
```sh
node app.js
```
  
[comment]: <> (**TODO:**) 

EndPoints (server)
---
**GET**  
- /channels  
- /channels/:cid 
- /channels/:cid/posts/:pid

**POST**  
- /channels
- /channels/:cid/posts

**PUT**
- /channels/:cid/posts/:pid

**DELETE**
- /channels/:cid
- /channels/:cid/posts/:pid

<!---
EndPoints (posts-server)
---
**GET**  
- /posts  
- /posts/:id 

**POST**  
- /posts 

**PUT**
- /posts/:id

**DELETE**
- /posts/:id 
-->

## Postman Tests
---
### AWS host (http://ec2-34-209-243-205.us-west-2.compute.amazonaws.com:8080)
- [API Collection Link](https://www.getpostman.com/collections/85cd9d4682870331dc21)
- [Testing Collection Link](https://www.getpostman.com/collections/f05450926448812cbd5d)
### localhost  
- [API Collection Link](https://www.getpostman.com/collections/a9310d90304242443007)
- [Testing Collection Link](https://www.getpostman.com/collections/4e29fe66253e824769f5)
