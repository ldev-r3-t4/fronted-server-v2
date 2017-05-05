# Frontend Server Repo - Large Scale - team 4  

### server - Frontend server
```sh
node app.js
```

EndPoints (server)
---
### **GET**  
---
- **/channels**  
  - (Returns array of channel ids)
- **/channels/:cid**
  - (Returns the specified channel)
- **/channels/:cid/posts/:pid**
  - (Returns the specified post in the specified channel)

### **POST**  
---
- **/channels**
  - (Creates a new channel)
  - (Accepts JSON data)
  - (Returns the new channel id)
- **/channels/:cid/posts**
  - (Creates a new post in the specified channel)
  - (Accepts JSON data)
  - (Returns the new post id)

### **PUT**
---
- **/channels/:cid/posts/:pid**
  - (Updates the specified post in the specified channel)
  - (Accepts JSON data)
  - (Returns "OK")

### **DELETE**
---
- **/channels/:cid**
  - (Deletes the specified channel)
  - (Returns "OK")
- **/channels/:cid/posts/:pid**
  - (Deletes the specified post in the specified channel)
  - (Returns "OK")

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

## Docker Tests (Main testing method)
---
Please read [Testing.md](https://github.com/ldev-r3-t4/frontend-server-v2/blob/master/Testing.md)

## Postman Tests
---
### AWS host (http://ec2-34-209-243-205.us-west-2.compute.amazonaws.com:8080)
- [API Collection Link](https://www.getpostman.com/collections/85cd9d4682870331dc21)
- [Testing Collection Link](https://www.getpostman.com/collections/f05450926448812cbd5d)
### localhost  
- [API Collection Link](https://www.getpostman.com/collections/a9310d90304242443007)
- [Testing Collection Link](https://www.getpostman.com/collections/4e29fe66253e824769f5)

## Other
---
### blob-storage (Optional Storage Server - Created for development)
```sh
node app.js
```
