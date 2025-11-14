import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useSession } from "@/components/SessionContextProvider";
import { Navigate } from "react-router-dom";

const Login = () => {
  const { session, isLoading } = useSession();

  // Se a sessão estiver carregando, não renderiza nada (o SessionContextProvider já mostra um loader)
  if (isLoading) {
    return null;
  }

  // Se o usuário já estiver logado, redireciona para o dashboard
  if (session) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-3">
              Área Administrativa
            </h1>
            <p className="text-muted-foreground">
              Acesso restrito para gestores e diretores
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-card shadow-lg">
            <Auth
              supabaseClient={supabase}
              providers={[]}
              appearance={{
                theme: ThemeSupa,
                variables: {
                    default: {
                        colors: {
                            brand: 'hsl(var(--primary))',
                            brandAccent: 'hsl(var(--primary-foreground))',
                            defaultButtonBackground: 'hsl(var(--secondary))',
                            defaultButtonBackgroundHover: 'hsl(var(--secondary)/90%)',
                            defaultButtonText: 'hsl(var(--secondary-foreground))',
                            inputBackground: 'hsl(var(--input))',
                            inputBorder: 'hsl(var(--border))',
                            inputBorderHover: 'hsl(var(--ring))',
                            inputBorderFocus: 'hsl(var(--ring))',
                        },
                    },
                },
              }}
              theme="light"
              view="sign_in"
              localization={{
                variables: {
                    sign_in: {
                        email_label: 'E-mail',
                        password_label: 'Senha',
                        email_input_placeholder: 'seu.email@exemplo.com',
                        password_input_placeholder: '••••••••',
                        button_label: 'Entrar',
                        loading_button_label: 'Entrando...',
                        link_text: 'Já tem uma conta? Entre',
                    },
                    sign_up: {
                        email_label: 'E-mail',
                        password_label: 'Senha',
                        email_input_placeholder: 'seu.email@exemplo.com',
                        password_input_placeholder: '••••••••',
                        button_label: 'Cadastrar',
                        loading_button_label: 'Cadastrando...',
                        link_text: 'Não tem uma conta? Cadastre-se',
                    },
                    forgotten_password: {
                        email_label: 'E-mail',
                        email_input_placeholder: 'seu.email@exemplo.com',
                        button_label: 'Enviar instruções de recuperação',
                        loading_button_label: 'Enviando...',
                        link_text: 'Esqueceu sua senha?',
                    },
                    update_password: {
                        password_label: 'Nova Senha',
                        password_input_placeholder: '••••••••',
                        button_label: 'Atualizar Senha',
                        loading_button_label: 'Atualizando...',
                    },
                }
              }}
            />
          </div>

          <div className="mt-6 p-4 bg-accent/10 border border-accent rounded-lg">
            <p className="text-sm text-foreground">
              <strong>Atenção:</strong> Esta área é exclusiva para usuários administrativos.
              Pais e responsáveis devem usar a área de consulta de inscrição.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;