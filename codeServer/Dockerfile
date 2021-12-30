FROM debian:unstable
RUN apt-get update && \
       apt-get install -y apt-utils && \
       apt-get install -y \
       curl \
       libsecret-1-dev \
       pkg-config \
       sudo \
       git \
       nano \
       procps \
       openjdk-16-jdk \
       maven
RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get install -y nodejs
RUN curl -fsSL https://code-server.dev/install.sh | sh
RUN useradd -r -u 3000 --create-home code
COPY codeHamster.vsix /tmp/codeHamster.vsix
RUN mkdir -p /var/vscode && \
       chown -R code:code /var/vscode
USER code
RUN code-server --install-extension=vscjava.vscode-java-pack --extensions-dir /var/vscode
RUN code-server --install-extension=/tmp/codeHamster.vsix --extensions-dir /var/vscode
WORKDIR /home/code
EXPOSE 3000
ENV OUTPUT_INTERFACE=HTTP
CMD code-server --auth=none --bind-addr=0.0.0.0:3000 --disable-telemetry --extensions-dir /var/vscode