-- Adicionar coluna valor_atual na tabela meta para permitir atualização manual do progresso
ALTER TABLE meta ADD COLUMN valor_atual numeric DEFAULT 0;