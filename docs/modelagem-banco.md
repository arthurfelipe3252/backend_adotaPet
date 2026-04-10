# Modelagem do Banco de Dados — AdotaPet

## Visão Geral

O banco segue a separação por bounded contexts. Cada módulo possui suas próprias tabelas, e relacionamentos entre módulos são feitos exclusivamente por `uuid` (FK lógica), sem constraints cross-module — facilitando a futura extração para microsserviços.

Todas as tabelas possuem `id` (UUID v4, PK), `created_at` e `updated_at` (timestamp with timezone).

---

## 1. Identity — Identidade & Acesso

### `users`

Tabela base de autenticação. Todo usuário (adotante ou ONG) tem um registro aqui.

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| id | uuid | PK, default random | |
| email | varchar(255) | NOT NULL, UNIQUE | Email de login |
| password_hash | text | NOT NULL | Senha criptografada (bcrypt) |
| role | enum('adopter', 'organization') | NOT NULL | Tipo de usuário |
| is_active | boolean | NOT NULL, default true | Conta ativa |
| created_at | timestamptz | NOT NULL | |
| updated_at | timestamptz | NOT NULL | |

### `adopter_profiles`

Perfil do adotante (pessoa física).

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| id | uuid | PK, default random | |
| user_id | uuid | NOT NULL, UNIQUE, FK → users | |
| name | text | NOT NULL | Nome completo |
| cpf | varchar(14) | NOT NULL, UNIQUE | CPF do adotante |
| phone | varchar(20) | NOT NULL | Telefone |
| avatar_url | text | | Foto de perfil |
| birth_date | date | | Data de nascimento |
| created_at | timestamptz | NOT NULL | |
| updated_at | timestamptz | NOT NULL | |

### `organization_profiles`

Perfil da ONG ou protetor independente (PF ou PJ).

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| id | uuid | PK, default random | |
| user_id | uuid | NOT NULL, UNIQUE, FK → users | |
| name | text | NOT NULL | Nome da organização / protetor |
| document | varchar(20) | NOT NULL, UNIQUE | CNPJ ou CPF |
| document_type | enum('cpf', 'cnpj') | NOT NULL | Tipo de documento |
| phone | varchar(20) | NOT NULL | Telefone |
| description | text | | Sobre a organização |
| avatar_url | text | | Logo / foto |
| address | text | | Endereço completo |
| city | varchar(100) | | Cidade |
| state | varchar(2) | | UF |
| latitude | numeric(10,7) | | Coordenada |
| longitude | numeric(10,7) | | Coordenada |
| is_verified | boolean | NOT NULL, default false | Verificação de autenticidade |
| created_at | timestamptz | NOT NULL | |
| updated_at | timestamptz | NOT NULL | |

---

## 2. Catalog — Catálogo de Pets

### `pets`

Registro de cada animal disponível para adoção.

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| id | uuid | PK, default random | |
| organization_id | uuid | NOT NULL | ID da ONG/protetor (ref: organization_profiles) |
| name | text | NOT NULL | Nome do pet |
| description | text | | Descrição livre |
| species | enum('dog', 'cat', 'other') | NOT NULL | Espécie |
| breed | varchar(100) | | Raça |
| size | enum('small', 'medium', 'large') | NOT NULL | Porte |
| age_months | integer | | Idade estimada em meses |
| sex | enum('male', 'female') | NOT NULL | Sexo |
| temperament | text | | Comportamento / personalidade |
| is_neutered | boolean | NOT NULL, default false | Castrado |
| is_vaccinated | boolean | NOT NULL, default false | Vacinado |
| status | enum('available', 'in_process', 'adopted') | NOT NULL, default 'available' | Status do pet |
| city | varchar(100) | | Cidade |
| state | varchar(2) | | UF |
| latitude | numeric(10,7) | | Coordenada |
| longitude | numeric(10,7) | | Coordenada |
| created_at | timestamptz | NOT NULL | |
| updated_at | timestamptz | NOT NULL | |

### `pet_photos`

Múltiplas fotos por pet.

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| id | uuid | PK, default random | |
| pet_id | uuid | NOT NULL, FK → pets | |
| url | text | NOT NULL | URL da imagem |
| is_primary | boolean | NOT NULL, default false | Foto principal |
| order | integer | NOT NULL, default 0 | Ordem de exibição |
| created_at | timestamptz | NOT NULL | |

---

## 3. Match — Match & Triagem

### `lifestyle_questionnaires`

Respostas do adotante sobre seu estilo de vida.

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| id | uuid | PK, default random | |
| adopter_id | uuid | NOT NULL, UNIQUE | ID do adotante (ref: adopter_profiles) |
| housing_type | enum('house_yard', 'house_no_yard', 'apartment') | NOT NULL | Tipo de moradia |
| has_outdoor_space | boolean | NOT NULL | Possui espaço externo |
| daily_hours_available | integer | NOT NULL | Horas disponíveis por dia |
| has_experience | boolean | NOT NULL | Experiência prévia com pets |
| has_children | boolean | NOT NULL | Possui crianças em casa |
| has_other_pets | boolean | NOT NULL | Possui outros animais |
| preferred_species | enum('dog', 'cat', 'other', 'any') | NOT NULL, default 'any' | Espécie preferida |
| preferred_size | enum('small', 'medium', 'large', 'any') | NOT NULL, default 'any' | Porte preferido |
| preferred_age | enum('puppy', 'young', 'adult', 'senior', 'any') | NOT NULL, default 'any' | Faixa etária preferida |
| created_at | timestamptz | NOT NULL | |
| updated_at | timestamptz | NOT NULL | |

### `match_results`

Resultado calculado de compatibilidade entre adotante e pet.

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| id | uuid | PK, default random | |
| adopter_id | uuid | NOT NULL | ID do adotante (ref: adopter_profiles) |
| pet_id | uuid | NOT NULL | ID do pet (ref: pets) |
| score | numeric(5,2) | NOT NULL | Pontuação de compatibilidade (0–100) |
| factors | jsonb | | Detalhamento dos fatores do score |
| created_at | timestamptz | NOT NULL | |

**Index:** UNIQUE(adopter_id, pet_id)

---

## 4. Adoption — Gestão de Adoção

### `adoption_requests`

Solicitação formal de adoção feita pelo adotante.

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| id | uuid | PK, default random | |
| adopter_id | uuid | NOT NULL | ID do adotante (ref: adopter_profiles) |
| pet_id | uuid | NOT NULL | ID do pet (ref: pets) |
| organization_id | uuid | NOT NULL | ID da ONG (ref: organization_profiles) |
| status | enum('pending', 'in_review', 'approved', 'rejected', 'cancelled') | NOT NULL, default 'pending' | Status da solicitação |
| message | text | | Mensagem do adotante |
| rejection_reason | text | | Motivo da recusa (se aplicável) |
| screening_score | numeric(5,2) | | Score da pré-triagem automática |
| reviewed_at | timestamptz | | Data da avaliação |
| created_at | timestamptz | NOT NULL | |
| updated_at | timestamptz | NOT NULL | |

### `adoptions`

Adoção concluída. Gerada quando a solicitação é aprovada e finalizada.

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| id | uuid | PK, default random | |
| request_id | uuid | NOT NULL, UNIQUE, FK → adoption_requests | Solicitação que originou a adoção |
| adopter_id | uuid | NOT NULL | ID do adotante |
| pet_id | uuid | NOT NULL, UNIQUE | ID do pet (1 adoção por pet) |
| organization_id | uuid | NOT NULL | ID da ONG |
| adopted_at | timestamptz | NOT NULL | Data da adoção |
| created_at | timestamptz | NOT NULL | |

---

## 5. Chat — Comunicação

### `conversations`

Conversa entre adotante e ONG, vinculada a uma solicitação de adoção.

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| id | uuid | PK, default random | |
| adoption_request_id | uuid | NOT NULL, UNIQUE | FK → adoption_requests |
| adopter_id | uuid | NOT NULL | ID do adotante |
| organization_id | uuid | NOT NULL | ID da ONG |
| is_active | boolean | NOT NULL, default true | Conversa ativa |
| created_at | timestamptz | NOT NULL | |

### `messages`

Mensagens dentro de uma conversa.

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| id | uuid | PK, default random | |
| conversation_id | uuid | NOT NULL, FK → conversations | |
| sender_id | uuid | NOT NULL | ID do user que enviou (ref: users) |
| content | text | NOT NULL | Conteúdo da mensagem |
| is_read | boolean | NOT NULL, default false | Lida pelo destinatário |
| created_at | timestamptz | NOT NULL | |

**Index:** conversation_id + created_at (para paginação)

---

## 6. Timeline — Pós-adoção

### `timeline_posts`

Fotos e atualizações enviadas pelo adotante após a adoção.

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| id | uuid | PK, default random | |
| adoption_id | uuid | NOT NULL, FK → adoptions | |
| pet_id | uuid | NOT NULL | ID do pet |
| author_id | uuid | NOT NULL | ID do adotante (ref: users) |
| content | text | | Texto da atualização |
| created_at | timestamptz | NOT NULL | |

### `timeline_photos`

Fotos vinculadas a um post da timeline.

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| id | uuid | PK, default random | |
| post_id | uuid | NOT NULL, FK → timeline_posts | |
| url | text | NOT NULL | URL da imagem |
| order | integer | NOT NULL, default 0 | Ordem |
| created_at | timestamptz | NOT NULL | |

---

## 7. Geo — Geolocalização

### `adoption_events`

Feiras de adoção e eventos presenciais.

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| id | uuid | PK, default random | |
| organization_id | uuid | NOT NULL | ID da ONG organizadora |
| title | text | NOT NULL | Nome do evento |
| description | text | | Detalhes |
| address | text | NOT NULL | Endereço |
| city | varchar(100) | NOT NULL | Cidade |
| state | varchar(2) | NOT NULL | UF |
| latitude | numeric(10,7) | NOT NULL | Coordenada |
| longitude | numeric(10,7) | NOT NULL | Coordenada |
| starts_at | timestamptz | NOT NULL | Início |
| ends_at | timestamptz | NOT NULL | Fim |
| created_at | timestamptz | NOT NULL | |
| updated_at | timestamptz | NOT NULL | |

---

## 8. Notifications — Notificações

### `notifications`

Notificações enviadas aos usuários (push e email).

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| id | uuid | PK, default random | |
| user_id | uuid | NOT NULL | Destinatário (ref: users) |
| type | enum('adoption_request', 'adoption_update', 'new_message', 'event_nearby', 'general') | NOT NULL | Tipo |
| title | text | NOT NULL | Título |
| body | text | NOT NULL | Conteúdo |
| is_read | boolean | NOT NULL, default false | Lida |
| metadata | jsonb | | Dados extras (IDs de referência, links) |
| created_at | timestamptz | NOT NULL | |

---

## 9. Payments — Pagamentos

### `subscriptions`

Assinatura mensal da ONG para uso da plataforma.

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| id | uuid | PK, default random | |
| organization_id | uuid | NOT NULL, UNIQUE | ID da ONG (ref: organization_profiles) |
| status | enum('active', 'past_due', 'cancelled') | NOT NULL, default 'active' | Status |
| current_period_start | timestamptz | NOT NULL | Início do período |
| current_period_end | timestamptz | NOT NULL | Fim do período |
| price_cents | integer | NOT NULL | Valor em centavos |
| created_at | timestamptz | NOT NULL | |
| updated_at | timestamptz | NOT NULL | |

### `donations`

Doações voluntárias de usuários.

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| id | uuid | PK, default random | |
| user_id | uuid | NOT NULL | Doador (ref: users) |
| amount_cents | integer | NOT NULL | Valor em centavos |
| status | enum('pending', 'confirmed', 'failed') | NOT NULL | Status do pagamento |
| payment_method | varchar(50) | | Método (pix, cartão) |
| external_id | text | | ID do gateway de pagamento |
| created_at | timestamptz | NOT NULL | |

---

## Diagrama de Relacionamentos

```
users
 ├── 1:1 → adopter_profiles
 └── 1:1 → organization_profiles
                ├── 1:N → pets
                │          ├── 1:N → pet_photos
                │          ├── N:M → match_results ← adopter_profiles
                │          └── 1:N → adoption_requests
                ├── 1:N → adoption_events
                └── 1:1 → subscriptions

adopter_profiles
 ├── 1:1 → lifestyle_questionnaires
 └── 1:N → adoption_requests
              ├── 1:1 → conversations
              │           └── 1:N → messages
              └── 1:1 → adoptions
                          └── 1:N → timeline_posts
                                      └── 1:N → timeline_photos

users
 └── 1:N → notifications
 └── 1:N → donations
```

---

## Enums

```
user_role:           'adopter', 'organization'
document_type:       'cpf', 'cnpj'
species:             'dog', 'cat', 'other'
pet_size:            'small', 'medium', 'large'
pet_sex:             'male', 'female'
pet_status:          'available', 'in_process', 'adopted'
housing_type:        'house_yard', 'house_no_yard', 'apartment'
preferred_species:   'dog', 'cat', 'other', 'any'
preferred_size:      'small', 'medium', 'large', 'any'
preferred_age:       'puppy', 'young', 'adult', 'senior', 'any'
request_status:      'pending', 'in_review', 'approved', 'rejected', 'cancelled'
subscription_status: 'active', 'past_due', 'cancelled'
donation_status:     'pending', 'confirmed', 'failed'
notification_type:   'adoption_request', 'adoption_update', 'new_message', 'event_nearby', 'general'
```

---

## Notas

- **UUIDs** em todas as PKs para facilitar a futura migração para microsserviços (sem conflito de IDs).
- **FKs cross-module** são lógicas (apenas o uuid é armazenado, sem constraint de FK no banco). FKs dentro do mesmo módulo são reais.
- **Valores monetários** em centavos (integer) para evitar problemas de ponto flutuante.
- **Timestamps** sempre com timezone (`timestamptz`).
- **JSONB** usado pontualmente para dados flexíveis (factors do match, metadata de notificação).
- **Soft delete** não foi adotado. Se necessário, adicionar coluna `deleted_at` nas tabelas relevantes.
