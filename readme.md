Current developing branch is "dev2"

**CnnVis** focuses on visualizing the training process of convolutional neural network

## Before you begin ##
We recommend you read about the basic building blocks that assemble a CnnVis application:

* MongoDB
* Express
* AngularJS 1.x (in the future, we are considering to use angular 2.x)
* Node.js
* Typescript

## Prerequisites ##

- Git
- Node.js
- MongoDB
- Bower

## Quick Install ##

1. `$ npm install typescript, typings, gulp, node-gyp`
2. `$ npm install`

## Running Your Application ##

Run your application using gulp:

    $ gulp

It will compile the source codes in ./src to the ./build folder in the project directory.

## Useful commands: ##
check your installed packages with command: npm list -g --depth=0

## File Structure ##
The folder structure is quite self-explanatory.

### src ###
The src folder contains all the source code written in typescript. It contains ..

### build ###
The build folder is where the .ts files are compiled (to .js) and stored.

### public ###
The public folder contains all the static files you use in your application, this is where you store your front-end files.

- **dist** the distribution folder is where your application compressed CSS and Javascript assets.
- **assets** website theme assets
- **lib** bower installed components
### Application Files ###
- **server.js** the main file (entry) of our application, where you initialize (start) the node.js application.
- **bower.json** bower definition file, where you configure the front-end components you want to use.
- **gulpfile.js** gulp definition file, where you define your gulp tasks.
- **package.json** npm definition file, where you configure the backend modules you want to use.

### Typescript Project File ###
- **tslint.json**
- **typings.json**
- **tsconfig.json**

### Hidden Configuration Files ###
- **.bowerrc** bower configuration file, you use it to tell bower where to install your application components.
- **.csslintrc** csslint configuration file, you use it to configure csslint special properties
- **.gitignore** git ignore file, you use it to tell git what ignore in next commits

## coding style guideline
Classes: CClassName
Interfaces: IInterfaceName
Methods: MyMethod
Data members: m_data
Private data members: m_data\_
Static data members: s_
Variables: myVar
Global variables: g_globalVar
Constants, Enumerations: AA_BB\_CC

## Notification
Change MAXSIZE in node_modules/bson/bson.js, if you find out of buffer bound error when you run bson.serialize()
Change namespace d3 to d4 in node_modules/@types/d3/index.d.ts, also do so in the file /public/lib/d3/d3.js(d3.min.js)