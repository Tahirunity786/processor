from django.views.generic import TemplateView

class LoginView(TemplateView):
    template_name = 'login.html'


class RegisterView(TemplateView):
    template_name = 'sign-up.html'


class RegisterProcessView(TemplateView):
    template_name = 'Sign-up-pros.html'


class IndexView(TemplateView):
    def __init__(self, lang='en'):
        self.template_name = f'{lang}/index.html'
        self.lang = lang

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['lang'] = self.lang
        return context


class TermsAndConditionView(TemplateView):
    def __init__(self, lang='en'):
        self.template_name = f'{lang}/terms-and-condition.html'
        self.lang = lang

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['lang'] = self.lang
        return context


class PrivacyPolicyView(TemplateView):
    def __init__(self, lang='en'):
        self.template_name = f'{lang}/privacy-policies.html'
        self.lang = lang

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['lang'] = self.lang
        return context
