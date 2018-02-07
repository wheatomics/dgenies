Install your own instance
=========================
    
Linux
-----

### Install

Install in 1 step (as root):

    pip install dgenies

Alternatively, you can install it manually:

    git clone https://forgemia.inra.fr/genotoul-bioinfo/dgenies.git
    cd dgenies
    pip install -r requirements.txt
    python3 setup.py install
    
### Upgrade

#### Standalone mode

    pip install dgenies --upgrade
    
#### Webserver mode

    dgenies clear -c
    pip install dgenies --upgrade
    
Then, you need to restart your webserver.
    
    
    
Requirements
------------

We use minimap2 for mapping. A binary of minimap2 is shipped with the program. Alternatively, you can
install your own from [their repository](https://github.com/lh3/minimap2).

Some python modules are required (will be automatically installed by the commands above):

    flask==0.12.*
    Flask-Mail==0.9.*
    Jinja2==2.9.*
    peewee==2.10.2
    docopt==0.6.*
    numpy
    wget==3.2
    requests==2.18.*
    biopython==1.70
    python-crontab==2.2.*
    psutil==5.4.*
    tendo==0.2.*
    matplotlib==2.1.*
    drmaa==0.7.*
    intervaltree==2.1.*
    argparse==1.4
    
    
    
How to start
-------------

You can launch DGenies in `standalone` mode or in `webserver` mode. You can use standalone mode if
you launch it locally and only one user launch jobs at once. If you are several users to use it
simultaneously or if you run it on a server, you must run it in webserver mode.

### Standalone mode

Start with the command below:

    dgenies run
    
Optional arguments:

`-p <port>` run in a specified port (default: 5000)  
`--no-browser` don't start the browser automatically

### Webserver mode

#### Recommended method

Flask webserver (which is used in standalone mode) is not recommended in production servers.  
So, we recommend using the WSGY module of Apache (or µWSGI + nginx, not documented here).

Once dgenies is installed, you just need to use the `/var/www/dgenies.wsgi` file into your apache
virtualhost file.

Here is an example of configuration file for apache:

    <VirtualHost *>
        ServerName <url>

        WSGIDaemonProcess dgenies user=<user> group=<group> threads=8
        WSGIScriptAlias / /var/www/dgenies.wsgi
    </VirtualHost>
    
With:  
`<url>`: the URL of your instance  
`<user>`: the user who launch the server  
`<group>`: the group who launch the server

#### Debug method

For debug or for development only, you can launch dgenies through flask in webserver mode:

    dgenies run -m webserver
    
Optional parameters:

`-d` run in debug mode  
`-o <IP>` specify the host into run the application (default: 127.0.0.1, set 0.0.0.0 for distant access)  
`-p <port>` run in a specified port (default: 5000)  
`--no-crons` don't run the crons automatically  
`--no-browser` don't start the browser automatically (always true if *-d* option is given)



Running with a cluster
----------------------

If you want to run jobs on a cluster, some configuration is required. We only support SLURM and SGE schedulers. But please note that only SLURM scheduler has been fully tested.

Note: submitting jobs on a cluster is only available for webserver mode.

Jobs are submitted throw the DRMAA library. So you need it for your scheduler. Please see [configuration below](#cluster) to define path to this library.

Also, scripts for preparing data must be moved in a location accessible by all nodes of your cluster. You must move them in a same folder and set the full path to `all_prepare.py` script (full path on the nodes of the cluster) in the configuration file ([see below](#cluster)).

To get these scripts, follow the commands below:

    curl https://forgemia.inra.fr/genotoul-bioinfo/dgenies/raw/master/get_cluster_scripts.py > get_cluster_scripts.py
    python get_cluster_scripts.py -d <dir>
    
With `<dir>`: the folder into save the scripts (must be accessible by cluster nodes).



Configuration
-------------

Changing the default configuration is not required for standalone mode, but you can want to custom some parts of the program.

Configuration is stored in the `/etc/dgenies/application.properties` file (linux). The file is divided in 8 parts described below.

To change this file, please copy it into `application.properties.local` (at the same location) to avoid erase of the file on upgrades.

### Global

Main parameters are stored into this section: 

* `config_dir`: where configuration file will be stored.
* `upload_folder`: where uploaded files will be stored.
* `data_folder`: where data files will be stored (PAF files and other files used for the dotplot).
* `threads_local`: number of threads to use for local jobs.
* `web_url`: public URL of your website.
* `max_upload_size`: max size allowed for query and target file (-1 to avoid the limit) - size uncompressed.
* `max_upload_size_ava`: max size allowed for target file for all-vs-all mode (only target given, -1 to avoid the limit) - size uncompressed.
* `max_upload_file_size`: max size of the uploaded size (real size of the file, compressed or not, -1 to avoid the limit).

For webserver mode only (ignored in standalone mode):

* `batch_system_type`: local for run all jobs locally, sge or slurm to use a cluster scheduler.

### Softwares

Paths to the external software should be set here:

* `minimap2`: path to minimap2 software (keep as it to use built-in)

And if you use a cluster:

* `minimap2_cluster`: path to minimap2 on the cluster

### Debug

Some parameters for debug:

* `enable`: True to enable debug
* `log_dir`: folder into store debug logs

### Cluster

This section concerns only the webserver mode with *batch_system_type* not set to *local*.

* `drmaa_lib_path`: absolute path to the drmaa library. Required as we use the DRMAA library to submit jobs to the cluster.
* `native_specs`: how to set memory, time and number of CPU on the cluster (should be kept as default).

By default, small jobs are still launched locally even if *batch_system_type* is not set to *local*, and if not too much of these jobs are running or waiting. This limit can be customized:

* `max_run_local`: max number of jobs running locally (if this number is reached, future jobs will be submitted to the cluster regardless of their size). Set to 0 to run all jobs on the cluster.
* `max_wait_local`; max number of jobs waiting for a local run (if this number is reached, future jobs will be submitted to the cluster regardless of their size). Set to 0 to run all jobs on the cluster.

You can also customize the size from which jobs are submitted on the cluster. If only one of these limit is reached, the job is submitted on the cluster.

* `min_query_size`: minimum size for the query (uncompressed).
* `min_size_target`: minimum size for the target (uncompressed).

Other parameters:

* `prepare_script`: absolute path to the all_prepare.py script downloaded in the section [above](#running-with-a-cluster).
* `python3_exec`: path to python3 executable on the cluster.
* `memory`: max memory to reserve on the cluster.
* `memory_ava`: max memory to reserve on the cluster un all-vs-all mode (should be higher than memory).
* `threads`: number of threads for launching jobs on the cluster (must be a divider of the memory).

### Database

This section concerns only the webserver mode.

In webserver mode, we use a database to store jobs.

* `type`: sqlite or mysql. We recommend mysql for better performances.
* `url`: path to the sqlite file, or url to the mysql server (localhost if the mysql server is on the same machine).

If type is mysql, some other parameters must be filled:

* `port`: port to connect to mysql (3306 as default).
* `db`: name of the database.
* `user`: username to connect to the database.
* `password`: the associated password.

### Mail

This section concerns only the webserver mode.

At the end of the job, a mail is send to the user to advise him of the end of the job.

* `status`: mail to use for status mail.
* `reply`: mail to use as reply to.
* `org`: name of the organisation who send the mail.
* `send_mail_status`: True to send mail status, False else. Should be True in production.

### Cron

This section concerns only the webserver mode.

We use crons to launch the local scheduler who start jobs, and some script that clean old jobs.

* `clean_time`: time at which we launch the clean job (example: 1h00)
* `clean_freq`: frequency of the clean job execution

### Jobs

This section concerns only the webserver mode.

Several parameters for jobs:

* `run_local`: max number of concurrent jobs launched locally.
* `data_prepare`: max number of data prepare jobs launched locally.
* `max_concurrent_dl`: max number of concurrent upload of files allowed.



Maintenance
-----------

The `dgenies` command can be used to do some maintenance staff.

**Clear all jobs:**

    dgenies clear -j [--max-age <age>]
    
`--max-age` (opt): set the max age of jobs to delete (default: 0, for all)
    
**Clear all log:**

    dgenies clear -l
    
**Clear crons (webserver mode):**

    dgenies clear -c
    
Gallery
-------

To add a job to the gallery, copy illustrating picture file into the *gallery* folder inside the data folder (*~/.dgenies/data/gallery* as default, create it if not exists). Then use the *dgenies* command:

    dgenies gallery add -i <id_job> -n <name> -q <query_name> -t <target_name> -p <pict_filename>
    
With:  
`id_job`: the name of the job  
`name`: name of the job to show in the gallery  
`query_name`: name of the query  
`target_name`: name of the target  
`pict_filename`: filename added in the gallery folder (without path)

You can also delete an item from the gallery:

    dgenies gallery del -i <id_job>
    
or:

    dgenies gallery del -n <name>
    
With `id_job` and `name` as described above. You can add the `--remove-pict` option to remove the picture file from the gallery folder.

Note: first item of the gallery will be shown on home page.