pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
        IMAGE_NAME = "maheenaamir90/devops-app"
        IMAGE_TAG  = "latest"
    }

    stages {

        stage('Code Fetch') {
            steps {
                echo '=== STAGE 1: Fetching Code from GitHub ==='
                git branch: 'main',
                    url: 'https://github.com/maheenaamir90/devops-app.git'
                echo '=== Code Fetched Successfully ==='
            }
        }

        stage('Docker Image Creation') {
            steps {
                echo '=== STAGE 2: Building Docker Image ==='
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
                echo '=== Logging into DockerHub ==='
                sh "echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin"
                echo '=== Pushing Image to DockerHub ==='
                sh "docker push ${IMAGE_NAME}:${IMAGE_TAG}"
                echo '=== Docker Image Pushed Successfully ==='
            }
        }

stage('Kubernetes Deployment') {
    steps {
        echo '=== STAGE 3: Refreshing Kube Certs & Deploying ==='
        sh '''
             chmod -R a+r /home/ubuntu/.minikube
             find /home/ubuntu/.minikube -type d -exec chmod a+x {} \\;
             cp /home/ubuntu/.kube/config /var/lib/jenkins/.kube/config
             chown jenkins:jenkins /var/lib/jenkins/.kube/config

             cp /home/ubuntu/.minikube/ca.crt \
                    /var/lib/jenkins/.minikube/ca.crt
             cp /home/ubuntu/.minikube/profiles/minikube/client.crt \
                    /var/lib/jenkins/.minikube/profiles/minikube/client.crt
             cp /home/ubuntu/.minikube/profiles/minikube/client.key \
                    /var/lib/jenkins/.minikube/profiles/minikube/client.key
             chown -R jenkins:jenkins /var/lib/jenkins/.minikube

            sed -i \
              's|/home/ubuntu/.minikube|/var/lib/jenkins/.minikube|g' \
              /var/lib/jenkins/.kube/config

            kubectl get nodes

            # Scale down first to free resources
            kubectl scale deployment devops-app --replicas=1 || true
            kubectl scale deployment mongo --replicas=1 || true

            kubectl apply -f k8s/deployment.yaml
            kubectl apply -f k8s/service.yaml

            # Load image into minikube directly
            minikube image load maheenaamir90/devops-app:latest

            kubectl rollout restart deployment/devops-app

            # Increased timeout to 3 minutes
            kubectl rollout status deployment/devops-app --timeout=180s

            echo "=== Running Pods ==="
            kubectl get pods

            echo "=== Services ==="
            kubectl get services
        '''
    }
}

        stage('Prometheus and Grafana') {
            steps {
                echo '=== STAGE 4: Setting Up Monitoring ==='
                sh '''
                    export KUBECONFIG=/var/lib/jenkins/.kube/config
                    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts || true
                    helm repo update
                    helm upgrade --install monitoring prometheus-community/kube-prometheus-stack \
                      --namespace monitoring \
                      --create-namespace \
                      --set grafana.service.type=NodePort \
                      --set grafana.service.nodePort=32000 \
                      --set prometheus.service.type=NodePort \
                      --set prometheus.service.nodePort=30090 \
                      --timeout 300s
                    kubectl get pods -n monitoring
                    kubectl get svc -n monitoring
                '''
                echo '=== Monitoring Stack Deployed ==='
            }
        }
    }

    post {
        success { echo '✅ ALL STAGES COMPLETED SUCCESSFULLY!' }
        failure { echo '❌ PIPELINE FAILED - CHECK LOGS ABOVE' }
        always  { sh 'docker logout || true' }
    }
}
